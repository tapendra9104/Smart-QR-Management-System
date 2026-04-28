package com.qrmanager.platform.integration.apikey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateApiKeyRequest(
    @NotBlank @Size(max = 120) String name,
    Instant expiresAt
) {
}
