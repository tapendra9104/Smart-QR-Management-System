package com.qrmanager.platform.auth.dto;

public record AuthTokensResponse(
    String accessToken,
    String refreshToken,
    UserResponse user
) {
}
