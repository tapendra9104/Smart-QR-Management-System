package com.qrmanager.platform.integration.apikey.dto;

import java.time.Instant;
import java.util.UUID;

public record ApiKeyResponse(
    UUID id,
    String name,
    String keyPrefix,
    Instant expiresAt,
    Instant revokedAt,
    Instant lastUsedAt,
    Instant createdAt,
    Instant updatedAt
) {
}
