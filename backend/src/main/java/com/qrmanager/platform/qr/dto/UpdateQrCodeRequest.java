package com.qrmanager.platform.qr.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public record UpdateQrCodeRequest(
    @NotBlank String name,
    String destinationUrl,
    QrCodeStyleDto style,
    Boolean isActive,
    Instant startsAt,
    Instant expiresAt
) {
}
