package com.qrmanager.platform.dashboard.dto;

import com.qrmanager.platform.qr.dto.QrCodeResponse;

import java.util.List;

public record DashboardSummaryResponse(
    long totalCodes,
    long totalScans,
    long averageScansPerCode,
    List<QrCodeResponse> recentCodes
) {
}
