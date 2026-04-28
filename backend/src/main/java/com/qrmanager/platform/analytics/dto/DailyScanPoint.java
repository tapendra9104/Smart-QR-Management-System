package com.qrmanager.platform.analytics.dto;

public record DailyScanPoint(
    String date,
    long scans
) {
}
