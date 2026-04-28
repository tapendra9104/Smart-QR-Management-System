package com.qrmanager.platform.analytics.dto;

import java.util.List;

public record AnalyticsOverviewResponse(
    long totalCodes,
    long totalScans,
    long todayScans,
    long weekScans,
    long uniqueCountries,
    long mobileScans,
    long desktopScans,
    List<DailyScanPoint> chartData,
    List<DeviceBreakdownItem> deviceData,
    List<TopPerformingQrResponse> topCodes
) {
}
