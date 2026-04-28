package com.qrmanager.platform.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
    @JsonProperty("refresh_token")
    @JsonAlias("refreshToken")
    @NotBlank String refreshToken
) {
}
