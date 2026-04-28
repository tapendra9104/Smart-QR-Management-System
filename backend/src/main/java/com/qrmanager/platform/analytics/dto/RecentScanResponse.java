package com.qrmanager.platform.analytics.dto;

import java.time.Instant;
import java.util.UUID;

public record RecentScanResponse(
    UUID id,
    Instant scannedAt,
    String country,
    String city,
    String deviceType,
    String browser,
    String os
) {
}
