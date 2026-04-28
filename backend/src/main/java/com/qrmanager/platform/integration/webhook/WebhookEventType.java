package com.qrmanager.platform.integration.webhook;

import java.util.Arrays;
import java.util.List;

public enum WebhookEventType {
    QR_CREATED("qr.created"),
    QR_UPDATED("qr.updated"),
    QR_DELETED("qr.deleted"),
    QR_SCANNED("qr.scanned"),
    QR_SUSPICIOUS_SCAN("qr.suspicious_scan"),
    QR_EXPIRED("qr.expired");

    private final String wireValue;

    WebhookEventType(String wireValue) {
        this.wireValue = wireValue;
    }

    public String wireValue() {
        return wireValue;
    }

    public static WebhookEventType fromWireValue(String value) {
        return Arrays.stream(values())
            .filter(eventType -> eventType.wireValue.equalsIgnoreCase(value))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unsupported webhook event: " + value));
    }

    public static List<String> supportedValues() {
        return Arrays.stream(values())
            .map(WebhookEventType::wireValue)
            .toList();
    }
}
