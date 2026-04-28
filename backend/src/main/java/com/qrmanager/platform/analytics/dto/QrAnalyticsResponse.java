package com.qrmanager.platform.analytics.dto;

import java.util.List;

public record QrAnalyticsResponse(
    long totalScans,
    long uniqueCountries,
    long mobileScans,
    long desktopScans,
    List<DailyScanPoint> chartData,
    List<DeviceBreakdownItem> deviceData,
    List<RecentScanResponse> recentScans
) {
}
