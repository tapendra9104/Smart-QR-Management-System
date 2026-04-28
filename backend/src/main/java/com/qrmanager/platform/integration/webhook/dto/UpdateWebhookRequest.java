package com.qrmanager.platform.integration.webhook.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateWebhookRequest(
    @Size(max = 160) String name,
    String targetUrl,
    List<String> subscribedEvents,
    Boolean isActive
) {
}
