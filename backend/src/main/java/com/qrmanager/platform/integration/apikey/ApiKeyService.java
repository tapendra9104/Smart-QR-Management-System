package com.qrmanager.platform.integration.apikey;

import com.qrmanager.platform.audit.AuditService;
import com.qrmanager.platform.common.BadRequestException;
import com.qrmanager.platform.common.ResourceNotFoundException;
import com.qrmanager.platform.integration.UsageLimitService;
import com.qrmanager.platform.integration.apikey.dto.ApiKeyResponse;
import com.qrmanager.platform.integration.apikey.dto.CreateApiKeyRequest;
import com.qrmanager.platform.integration.apikey.dto.CreatedApiKeyResponse;
import com.qrmanager.platform.user.User;
import com.qrmanager.platform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final UsageLimitService usageLimitService;
    private final AuditService auditService;

    public List<ApiKeyResponse> listForUser(UUID userId) {
        return apiKeyRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public CreatedApiKeyResponse create(UUID userId, CreateApiKeyRequest request) {
        usageLimitService.assertCanCreateApiKey(userId);
        if (request.expiresAt() != null && !request.expiresAt().isAfter(Instant.now())) {
            throw new BadRequestException("API key expiry must be in the future");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String plaintext = generatePlaintextKey();
        ApiKey apiKey = apiKeyRepository.save(ApiKey.builder()
            .user(user)
            .name(request.name().trim())
            .keyPrefix(plaintext.substring(0, Math.min(12, plaintext.length())))
            .keyHash(hashKey(plaintext))
            .expiresAt(request.expiresAt())
            .build());

        auditService.log(userId, "API_KEY_CREATED", "API_KEY", apiKey.getId().toString(), Map.of(
            "name", apiKey.getName(),
            "prefix", apiKey.getKeyPrefix()
        ));

        return new CreatedApiKeyResponse(toResponse(apiKey), plaintext);
    }

    @Transactional
    public void revoke(UUID userId, UUID apiKeyId) {
        ApiKey apiKey = apiKeyRepository.findByIdAndUserId(apiKeyId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("API key not found"));

        if (apiKey.getRevokedAt() == null) {
            apiKey.setRevokedAt(Instant.now());
            apiKeyRepository.save(apiKey);
            auditService.log(userId, "API_KEY_REVOKED", "API_KEY", apiKey.getId().toString(), Map.of(
                "prefix", apiKey.getKeyPrefix()
            ));
        }
    }

    public ApiKey authenticate(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            throw new BadRequestException("API key is required");
        }

        ApiKey apiKey = apiKeyRepository.findByKeyHash(hashKey(plaintext.trim()))
            .orElseThrow(() -> new ResourceNotFoundException("API key not found"));

        if (apiKey.getRevokedAt() != null) {
            throw new BadRequestException("API key has been revoked");
        }
        if (apiKey.getExpiresAt() != null && apiKey.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("API key has expired");
        }

        return apiKey;
    }

    @Transactional
    public void recordUse(ApiKey apiKey) {
        apiKey.setLastUsedAt(Instant.now());
        apiKeyRepository.save(apiKey);
    }

    public ApiKeyResponse toResponse(ApiKey apiKey) {
        return new ApiKeyResponse(
            apiKey.getId(),
            apiKey.getName(),
            apiKey.getKeyPrefix(),
            apiKey.getExpiresAt(),
            apiKey.getRevokedAt(),
            apiKey.getLastUsedAt(),
            apiKey.getCreatedAt(),
            apiKey.getUpdatedAt()
        );
    }

    private String generatePlaintextKey() {
        return "seq_" + UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
    }

    private String hashKey(String plaintext) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(plaintext.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 not available", exception);
        }
    }
}
