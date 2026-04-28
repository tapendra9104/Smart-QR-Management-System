package com.qrmanager.platform.analytics.dto;

import java.util.UUID;

public record TopPerformingQrResponse(
    UUID id,
    String name,
    long totalScans
) {
}
