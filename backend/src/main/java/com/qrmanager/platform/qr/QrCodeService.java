package com.qrmanager.platform.qr;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmanager.platform.audit.AuditService;
import com.qrmanager.platform.common.BadRequestException;
import com.qrmanager.platform.common.ResourceNotFoundException;
import com.qrmanager.platform.integration.UsageLimitService;
import com.qrmanager.platform.integration.webhook.WebhookDispatchService;
import com.qrmanager.platform.integration.webhook.WebhookEventType;
import com.qrmanager.platform.qr.dto.BulkCreateItem;
import com.qrmanager.platform.qr.dto.BulkCreateRequest;
import com.qrmanager.platform.qr.dto.BulkCreateResult;
import com.qrmanager.platform.qr.dto.CreateQrCodeRequest;
import com.qrmanager.platform.qr.dto.QrCodeResponse;
import com.qrmanager.platform.qr.dto.QrCodeStyleDto;
import com.qrmanager.platform.qr.dto.UpdateQrCodeRequest;
import com.qrmanager.platform.user.User;
import com.qrmanager.platform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QrCodeService {

    private final QrCodeRepository qrCodeRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final ShortCodeGenerator shortCodeGenerator;
    private final AuditService auditService;
    private final com.qrmanager.platform.config.AppProperties appProperties;
    private final RedirectUrlSigner redirectUrlSigner;
    private final UsageLimitService usageLimitService;
    private final WebhookDispatchService webhookDispatchService;

    public List<QrCodeResponse> listForUser(UUID userId) {
        return qrCodeRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public org.springframework.data.domain.Page<QrCodeResponse> listForUser(UUID userId, String search, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<QrCodeEntity> page;
        if (search != null && !search.isBlank()) {
            page = qrCodeRepository.searchByUserIdAndName(userId, search.trim(), pageable);
        } else {
            page = qrCodeRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
        return page.map(this::toResponse);
    }

    public QrCodeResponse getForUser(UUID userId, UUID qrCodeId) {
        return toResponse(getEntityForUser(userId, qrCodeId));
    }

    @Transactional
    @CacheEvict(cacheNames = "qrByShortCode", allEntries = true)
    public QrCodeResponse createForUser(UUID userId, CreateQrCodeRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        usageLimitService.assertCanCreateQrCode(userId);
        validateRequest(request.isDynamic(), request.destinationUrl(), request.contentType(), request.content());
        validateLifecycleWindow(request.startsAt(), request.expiresAt());
        String shortCode = generateUniqueShortCode();
        ContentType contentType = ContentType.fromValue(request.contentType());
        boolean isDynamic = Boolean.TRUE.equals(request.isDynamic());
        String normalizedContent = request.content().trim();
        String resolvedDestination = resolveDestination(contentType, isDynamic, normalizedContent, request.destinationUrl());

        QrCodeEntity entity = QrCodeEntity.builder()
            .user(user)
            .name(request.name().trim())
            .shortCode(shortCode)
            .content(normalizedContent)
            .contentType(contentType)
            .destinationUrl(resolvedDestination)
            .dynamic(isDynamic)
            .active(true)
            .startsAt(request.startsAt())
            .styleJson(writeStyle(request.style()))
            .totalScans(0)
            .expiresAt(request.expiresAt())
            .build();

        QrCodeEntity saved = qrCodeRepository.save(entity);
        auditService.log(userId, "QR_CREATED", "QR_CODE", saved.getId().toString(), Map.of(
            "shortCode", saved.getShortCode(),
            "contentType", saved.getContentType().name(),
            "dynamic", saved.isDynamic()
        ));
        webhookDispatchService.dispatchAsync(userId, WebhookEventType.QR_CREATED, Map.of(
            "qr_code_id", saved.getId(),
            "short_code", saved.getShortCode(),
            "name", saved.getName(),
            "content_type", saved.getContentType().toApiValue(),
            "is_dynamic", saved.isDynamic()
        ));
        return toResponse(saved);
    }

    @Transactional
    @CacheEvict(cacheNames = "qrByShortCode", allEntries = true)
    public QrCodeResponse updateForUser(UUID userId, UUID qrCodeId, UpdateQrCodeRequest request) {
        QrCodeEntity entity = getEntityForUser(userId, qrCodeId);

        entity.setName(request.name().trim());
        if (request.style() != null) {
            entity.setStyleJson(writeStyle(request.style()));
        }
        Instant nextStartsAt = request.startsAt() != null ? request.startsAt() : entity.getStartsAt();
        Instant nextExpiresAt = request.expiresAt() != null ? request.expiresAt() : entity.getExpiresAt();
        validateLifecycleWindow(nextStartsAt, nextExpiresAt);

        if (request.startsAt() != null) {
            entity.setStartsAt(request.startsAt());
        }
        if (request.expiresAt() != null) {
            entity.setExpiresAt(request.expiresAt());
        }
        if (entity.isDynamic() || entity.getContentType() == ContentType.URL) {
            String destinationUrl = entity.getContentType() == ContentType.URL && !entity.isDynamic()
                ? entity.getContent()
                : blankToNull(request.destinationUrl());
            validateDynamicDestination(entity.getContentType(), destinationUrl);
            entity.setDestinationUrl(destinationUrl);
            if (entity.getContentType() == ContentType.URL && destinationUrl != null) {
                entity.setContent(destinationUrl);
            }
        }
        if (request.isActive() != null) {
            entity.setActive(request.isActive());
        }

        QrCodeEntity saved = qrCodeRepository.save(entity);
        auditService.log(userId, "QR_UPDATED", "QR_CODE", saved.getId().toString(), Map.of(
            "active", saved.isActive(),
            "version", saved.getVersion()
        ));
        webhookDispatchService.dispatchAsync(userId, WebhookEventType.QR_UPDATED, qrUpdatePayload(saved));
        return toResponse(saved);
    }

    @Transactional
    @CacheEvict(cacheNames = "qrByShortCode", allEntries = true)
    public void deleteForUser(UUID userId, UUID qrCodeId) {
        QrCodeEntity entity = getEntityForUser(userId, qrCodeId);
        qrCodeRepository.delete(entity);
        auditService.log(userId, "QR_DELETED", "QR_CODE", qrCodeId.toString(), Map.of(
            "shortCode", entity.getShortCode()
        ));
        webhookDispatchService.dispatchAsync(userId, WebhookEventType.QR_DELETED, Map.of(
            "qr_code_id", qrCodeId,
            "short_code", entity.getShortCode(),
            "name", entity.getName()
        ));
    }

    @Transactional
    @CacheEvict(cacheNames = "qrByShortCode", allEntries = true)
    public BulkCreateResult bulkCreate(UUID userId, BulkCreateRequest request) {
        List<QrCodeResponse> responses = request.items().stream()
            .map(item -> createBulkItem(userId, item))
            .toList();
        return new BulkCreateResult(responses);
    }

    public QrCodeEntity getEntityForUser(UUID userId, UUID qrCodeId) {
        return qrCodeRepository.findByIdAndUserId(qrCodeId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("QR code not found"));
    }

    @Cacheable(cacheNames = "qrByShortCode", key = "#shortCode")
    public QrCodeEntity getActiveByShortCode(String shortCode) {
        QrCodeEntity qrCode = qrCodeRepository.findByShortCode(shortCode)
            .orElseThrow(() -> new ResourceNotFoundException("QR code not found"));

        if (!qrCode.isActive()) {
            throw new ResourceNotFoundException("QR code is inactive");
        }
        if (qrCode.getStartsAt() != null && qrCode.getStartsAt().isAfter(Instant.now())) {
            throw new ResourceNotFoundException("QR code is not active yet");
        }
        if (qrCode.getExpiresAt() != null && qrCode.getExpiresAt().isBefore(Instant.now())) {
            throw new ResourceNotFoundException("QR code has expired");
        }

        return qrCode;
    }

    public QrCodeResponse toResponse(QrCodeEntity entity) {
        String qrPayload = buildQrPayload(entity);
        return new QrCodeResponse(
            entity.getId(),
            entity.getUser().getId(),
            entity.getName(),
            entity.getShortCode(),
            entity.getContent(),
            qrPayload,
            entity.getContentType().toApiValue(),
            entity.getDestinationUrl(),
            entity.isDynamic(),
            entity.isActive(),
            readStyle(entity.getStyleJson()),
            entity.getTotalScans(),
            entity.getVersion(),
            entity.getStartsAt(),
            entity.getExpiresAt(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    private QrCodeResponse createBulkItem(UUID userId, BulkCreateItem item) {
        usageLimitService.assertCanCreateQrCode(userId);
        String shortCode = generateUniqueShortCode();
        String destinationUrl = item.content().trim();
        validateHttpUrl(destinationUrl, "Please enter a valid website URL");

        QrCodeEntity entity = QrCodeEntity.builder()
            .user(userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found")))
            .name(item.name().trim())
            .shortCode(shortCode)
            .content(destinationUrl)
            .contentType(ContentType.URL)
            .destinationUrl(destinationUrl)
            .dynamic(true)
            .active(true)
            .styleJson(writeStyle(defaultStyle()))
            .totalScans(0)
            .build();
        QrCodeEntity saved = qrCodeRepository.save(entity);
        auditService.log(userId, "QR_CREATED", "QR_CODE", saved.getId().toString(), Map.of(
            "shortCode", saved.getShortCode(),
            "contentType", saved.getContentType().name(),
            "dynamic", saved.isDynamic()
        ));
        webhookDispatchService.dispatchAsync(userId, WebhookEventType.QR_CREATED, Map.of(
            "qr_code_id", saved.getId(),
            "short_code", saved.getShortCode(),
            "name", saved.getName(),
            "content_type", saved.getContentType().toApiValue(),
            "is_dynamic", saved.isDynamic()
        ));
        return toResponse(saved);
    }

    private void validateRequest(Boolean isDynamic, String destinationUrl, String contentType, String content) {
        ContentType parsedType;
        try {
            parsedType = ContentType.fromValue(contentType);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported QR content type");
        }

        if (parsedType == ContentType.URL) {
            validateHttpUrl(content, "Please enter a valid website URL");
            if (Boolean.TRUE.equals(isDynamic) && destinationUrl != null && !destinationUrl.isBlank()) {
                validateHttpUrl(destinationUrl, "Please enter a valid redirect URL");
            }
            return;
        }

        if (Boolean.TRUE.equals(isDynamic)) {
            validateDynamicDestination(parsedType, blankToNull(destinationUrl));
        }
    }

    private void validateDynamicDestination(ContentType contentType, String destinationUrl) {
        if (destinationUrl == null || destinationUrl.isBlank()) {
            throw new BadRequestException(
                contentType == ContentType.URL
                    ? "Dynamic URL QR codes require a destination URL"
                    : "Dynamic non-URL QR codes require a destination URL"
            );
        }

        validateHttpUrl(destinationUrl, "Please enter a valid redirect URL");
    }

    private void validateHttpUrl(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        try {
            URI uri = new URI(value.trim());
            String scheme = uri.getScheme();
            if (scheme == null || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                throw new BadRequestException(message);
            }

            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new BadRequestException(message);
            }
        } catch (URISyntaxException exception) {
            throw new BadRequestException(message);
        }
    }

    private void validateLifecycleWindow(Instant startsAt, Instant expiresAt) {
        if (startsAt != null && expiresAt != null && !expiresAt.isAfter(startsAt)) {
            throw new BadRequestException("Expiry must be after the start time");
        }
    }

    private String resolveDestination(ContentType contentType, boolean isDynamic, String normalizedContent, String destinationUrl) {
        if (contentType == ContentType.URL) {
            return normalizedContent;
        }
        if (!isDynamic) {
            return null;
        }
        return blankToNull(destinationUrl);
    }

    private String buildQrPayload(QrCodeEntity entity) {
        if (entity.getContentType() == ContentType.URL || entity.isDynamic()) {
            return redirectUrlSigner.buildSignedResolveUrl(appProperties.frontendUrl(), entity.getShortCode());
        }
        return entity.getContent();
    }

    private Map<String, Object> qrUpdatePayload(QrCodeEntity entity) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("qr_code_id", entity.getId());
        payload.put("short_code", entity.getShortCode());
        payload.put("name", entity.getName());
        payload.put("is_active", entity.isActive());
        payload.put("starts_at", entity.getStartsAt());
        payload.put("expires_at", entity.getExpiresAt());
        return payload;
    }

    private String generateUniqueShortCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String candidate = shortCodeGenerator.generate();
            if (!qrCodeRepository.existsByShortCode(candidate)) {
                return candidate;
            }
        }
        throw new BadRequestException("Unable to generate a unique short code");
    }

    private String writeStyle(QrCodeStyleDto style) {
        try {
            return objectMapper.writeValueAsString(style == null ? defaultStyle() : style);
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("Invalid style payload");
        }
    }

    private QrCodeStyleDto readStyle(String styleJson) {
        try {
            return objectMapper.readValue(styleJson, QrCodeStyleDto.class);
        } catch (JsonProcessingException exception) {
            return defaultStyle();
        }
    }

    private QrCodeStyleDto defaultStyle() {
        return new QrCodeStyleDto(
            "#000000",
            "#ffffff",
            256,
            16,
            "M",
            "squares",
            0,
            null,
            60,
            60,
            1.0,
            true
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
