package com.qrmanager.platform.integration.webhook;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmanager.platform.audit.AuditService;
import com.qrmanager.platform.common.BadRequestException;
import com.qrmanager.platform.common.ResourceNotFoundException;
import com.qrmanager.platform.integration.UsageLimitService;
import com.qrmanager.platform.integration.webhook.dto.CreateWebhookRequest;
import com.qrmanager.platform.integration.webhook.dto.CreatedWebhookResponse;
import com.qrmanager.platform.integration.webhook.dto.UpdateWebhookRequest;
import com.qrmanager.platform.integration.webhook.dto.WebhookResponse;
import com.qrmanager.platform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URISyntaxException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WebhookService {

    private final WebhookRepository webhookRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final UsageLimitService usageLimitService;
    private final AuditService auditService;

    public List<WebhookResponse> listForUser(UUID userId) {
        return webhookRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public CreatedWebhookResponse create(UUID userId, CreateWebhookRequest request) {
        usageLimitService.assertCanCreateWebhook(userId);
        validateTargetUrl(request.targetUrl());
        String subscribedEvents = writeSubscribedEvents(request.subscribedEvents());
        String signingSecret = generateSigningSecret();

        WebhookEndpoint webhook = webhookRepository.save(WebhookEndpoint.builder()
            .user(userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found")))
            .name(request.name().trim())
            .targetUrl(request.targetUrl().trim())
            .signingSecret(signingSecret)
            .subscribedEvents(subscribedEvents)
            .active(true)
            .build());

        auditService.log(userId, "WEBHOOK_CREATED", "WEBHOOK", webhook.getId().toString(), Map.of(
            "name", webhook.getName(),
            "targetUrl", webhook.getTargetUrl()
        ));

        return new CreatedWebhookResponse(toResponse(webhook), signingSecret);
    }

    @Transactional
    public WebhookResponse update(UUID userId, UUID webhookId, UpdateWebhookRequest request) {
        WebhookEndpoint webhook = webhookRepository.findByIdAndUserId(webhookId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Webhook not found"));

        if (request.name() != null && !request.name().isBlank()) {
            webhook.setName(request.name().trim());
        }
        if (request.targetUrl() != null && !request.targetUrl().isBlank()) {
            validateTargetUrl(request.targetUrl());
            webhook.setTargetUrl(request.targetUrl().trim());
        }
        if (request.subscribedEvents() != null && !request.subscribedEvents().isEmpty()) {
            webhook.setSubscribedEvents(writeSubscribedEvents(request.subscribedEvents()));
        }
        if (request.isActive() != null) {
            webhook.setActive(request.isActive());
        }

        webhookRepository.save(webhook);
        auditService.log(userId, "WEBHOOK_UPDATED", "WEBHOOK", webhook.getId().toString(), Map.of(
            "active", webhook.isActive(),
            "targetUrl", webhook.getTargetUrl()
        ));
        return toResponse(webhook);
    }

    @Transactional
    public void delete(UUID userId, UUID webhookId) {
        WebhookEndpoint webhook = webhookRepository.findByIdAndUserId(webhookId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Webhook not found"));
        webhookRepository.delete(webhook);
        auditService.log(userId, "WEBHOOK_DELETED", "WEBHOOK", webhookId.toString(), Map.of(
            "targetUrl", webhook.getTargetUrl()
        ));
    }

    public WebhookResponse toResponse(WebhookEndpoint webhook) {
        return new WebhookResponse(
            webhook.getId(),
            webhook.getName(),
            webhook.getTargetUrl(),
            readSubscribedEvents(webhook),
            webhook.isActive(),
            webhook.getLastAttemptAt(),
            webhook.getLastSuccessAt(),
            webhook.getLastResponseStatus(),
            webhook.getLastError(),
            webhook.getCreatedAt(),
            webhook.getUpdatedAt()
        );
    }

    private void validateTargetUrl(String targetUrl) {
        try {
            URI uri = new URI(targetUrl.trim());
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new BadRequestException("Webhook target URL must be HTTP or HTTPS");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new BadRequestException("Webhook target URL must include a host");
            }
        } catch (URISyntaxException exception) {
            throw new BadRequestException("Webhook target URL is invalid");
        }
    }

    private String writeSubscribedEvents(List<String> subscribedEvents) {
        try {
            List<String> normalized = subscribedEvents.stream()
                .map(WebhookEventType::fromWireValue)
                .map(WebhookEventType::wireValue)
                .distinct()
                .toList();
            return objectMapper.writeValueAsString(normalized);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(exception.getMessage());
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("Unable to store webhook subscriptions");
        }
    }

    private List<String> readSubscribedEvents(WebhookEndpoint webhook) {
        try {
            return objectMapper.readValue(
                webhook.getSubscribedEvents(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String generateSigningSecret() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
