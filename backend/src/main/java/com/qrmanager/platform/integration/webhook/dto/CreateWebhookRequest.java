package com.qrmanager.platform.integration.webhook.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateWebhookRequest(
    @NotBlank @Size(max = 160) String name,
    @NotBlank String targetUrl,
    @NotEmpty List<String> subscribedEvents
) {
}
