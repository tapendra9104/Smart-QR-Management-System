package com.qrmanager.platform.dashboard;

import com.qrmanager.platform.dashboard.dto.DashboardSummaryResponse;
import com.qrmanager.platform.analytics.ClickHouseAnalyticsStore;
import com.qrmanager.platform.qr.QrCodeRepository;
import com.qrmanager.platform.qr.QrCodeService;
import org.springframework.beans.factory.ObjectProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final QrCodeRepository qrCodeRepository;
    private final com.qrmanager.platform.analytics.ScanEventRepository scanEventRepository;
    private final QrCodeService qrCodeService;
    private final ObjectProvider<ClickHouseAnalyticsStore> clickHouseAnalyticsStoreProvider;

    public DashboardSummaryResponse getSummary(UUID userId) {
        var codes = qrCodeRepository.findByUserIdOrderByCreatedAtDesc(userId);
        long totalCodes = codes.size();
        ClickHouseAnalyticsStore clickHouseAnalyticsStore = clickHouseAnalyticsStoreProvider.getIfAvailable();
        long totalScans = clickHouseAnalyticsStore != null
            ? clickHouseAnalyticsStore.countByUserId(userId)
            : scanEventRepository.countByUserId(userId);
        long averageScansPerCode = totalCodes == 0 ? 0 : Math.round((double) totalScans / totalCodes);

        return new DashboardSummaryResponse(
            totalCodes,
            totalScans,
            averageScansPerCode,
            codes.stream().limit(5).map(qrCodeService::toResponse).toList()
        );
    }
}
