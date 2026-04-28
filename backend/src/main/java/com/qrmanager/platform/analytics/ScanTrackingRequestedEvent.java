package com.qrmanager.platform.analytics;

import java.time.Instant;
import java.util.UUID;

public record ScanTrackingRequestedEvent(
    UUID eventId,
    UUID qrCodeId,
    UUID userId,
    Instant scannedAt,
    String ipAddress,
    String userAgent,
    String referer,
    String country,
    String city,
    String deviceType,
    String browser,
    String os
) {
}
