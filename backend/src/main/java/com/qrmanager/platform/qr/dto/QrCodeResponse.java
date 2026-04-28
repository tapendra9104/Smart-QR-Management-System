package com.qrmanager.platform.qr.dto;

import java.time.Instant;
import java.util.UUID;

public record QrCodeResponse(
    UUID id,
    UUID userId,
    String name,
    String shortCode,
    String content,
    String qrPayload,
    String contentType,
    String destinationUrl,
    boolean isDynamic,
    boolean isActive,
    QrCodeStyleDto style,
    long totalScans,
    long version,
    Instant startsAt,
    Instant expiresAt,
    Instant createdAt,
    Instant updatedAt
) {
}
