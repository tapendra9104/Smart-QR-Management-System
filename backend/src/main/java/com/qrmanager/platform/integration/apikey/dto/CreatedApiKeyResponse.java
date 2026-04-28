package com.qrmanager.platform.integration.apikey.dto;

public record CreatedApiKeyResponse(
    ApiKeyResponse apiKey,
    String plaintextKey
) {
}
