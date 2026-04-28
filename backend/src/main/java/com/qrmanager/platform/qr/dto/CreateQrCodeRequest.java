package com.qrmanager.platform.qr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateQrCodeRequest(
    @NotBlank String name,
    @NotBlank String content,
    @NotBlank String contentType,
    String destinationUrl,
    @NotNull Boolean isDynamic,
    @NotNull QrCodeStyleDto style,
    Instant startsAt,
    Instant expiresAt
) {
}
