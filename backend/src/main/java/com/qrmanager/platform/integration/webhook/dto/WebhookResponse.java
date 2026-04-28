package com.qrmanager.platform.integration.webhook.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WebhookResponse(
    UUID id,
    String name,
    String targetUrl,
    List<String> subscribedEvents,
    boolean isActive,
    Instant lastAttemptAt,
    Instant lastSuccessAt,
    Integer lastResponseStatus,
    String lastError,
    Instant createdAt,
    Instant updatedAt
) {
}
