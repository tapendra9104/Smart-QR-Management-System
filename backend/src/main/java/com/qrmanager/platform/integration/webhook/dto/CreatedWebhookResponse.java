package com.qrmanager.platform.integration.webhook.dto;

public record CreatedWebhookResponse(
    WebhookResponse webhook,
    String signingSecret
) {
}
