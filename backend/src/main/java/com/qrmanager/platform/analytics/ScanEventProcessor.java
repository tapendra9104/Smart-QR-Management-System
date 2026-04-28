package com.qrmanager.platform.analytics;

import com.qrmanager.platform.integration.webhook.WebhookDispatchService;
import com.qrmanager.platform.integration.webhook.WebhookEventType;
import com.qrmanager.platform.qr.QrCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScanEventProcessor {

    private final ScanEventRepository scanEventRepository;
    private final QrCodeRepository qrCodeRepository;
    private final ObjectProvider<ClickHouseAnalyticsStore> clickHouseAnalyticsStoreProvider;
    private final WebhookDispatchService webhookDispatchService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Retryable(
        retryFor = Exception.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 250, multiplier = 2.0)
    )
    public void process(ScanTrackingRequestedEvent event) {
        if (!scanEventRepository.existsById(event.eventId())) {
            SuspicionAssessment suspicionAssessment = assessSuspicion(event);
            ScanEvent scanEvent = ScanEvent.builder()
                .id(event.eventId())
                .qrCode(qrCodeRepository.getReferenceById(event.qrCodeId()))
                .userId(event.userId())
                .scannedAt(event.scannedAt())
                .ipAddress(event.ipAddress())
                .userAgent(event.userAgent())
                .referer(event.referer())
                .country(event.country())
                .city(event.city())
                .deviceType(event.deviceType())
                .suspicious(suspicionAssessment.suspicious())
                .anomalyReason(suspicionAssessment.reason())
                .browser(event.browser())
                .os(event.os())
                .build();

            scanEventRepository.save(scanEvent);
            qrCodeRepository.incrementTotalScans(event.qrCodeId());

            webhookDispatchService.dispatchAsync(event.userId(), WebhookEventType.QR_SCANNED, scanPayload(event, suspicionAssessment));

            if (suspicionAssessment.suspicious()) {
                webhookDispatchService.dispatchAsync(event.userId(), WebhookEventType.QR_SUSPICIOUS_SCAN, suspiciousPayload(event, suspicionAssessment));
            }
        }

        clickHouseAnalyticsStoreProvider.ifAvailable(store -> store.insertScanEvent(event));
    }

    @Recover
    public void recover(Exception exception, ScanTrackingRequestedEvent event) {
        log.error("Failed to process scan event for QR {}", event.qrCodeId(), exception);
    }

    private SuspicionAssessment assessSuspicion(ScanTrackingRequestedEvent event) {
        Instant cutoff = event.scannedAt().minusSeconds(900);
        long recentQrScans = scanEventRepository.countByQrCodeIdAndScannedAtAfter(event.qrCodeId(), cutoff);
        long recentIpScans = event.ipAddress() == null || event.ipAddress().isBlank()
            ? 0
            : scanEventRepository.countByQrCodeIdAndIpAddressAndScannedAtAfter(event.qrCodeId(), event.ipAddress(), cutoff);

        if (recentIpScans >= 10) {
            return new SuspicionAssessment(true, "Repeated scans from the same network fingerprint");
        }
        if (recentQrScans >= 100) {
            return new SuspicionAssessment(true, "Unusual scan spike detected");
        }

        return new SuspicionAssessment(false, null);
    }

    private record SuspicionAssessment(boolean suspicious, String reason) {
    }

    private Map<String, Object> scanPayload(ScanTrackingRequestedEvent event, SuspicionAssessment suspicionAssessment) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("qr_code_id", event.qrCodeId());
        payload.put("scanned_at", event.scannedAt());
        payload.put("country", event.country());
        payload.put("city", event.city());
        payload.put("device_type", event.deviceType());
        payload.put("browser", event.browser());
        payload.put("os", event.os());
        payload.put("is_suspicious", suspicionAssessment.suspicious());
        payload.put("anomaly_reason", suspicionAssessment.reason());
        return payload;
    }

    private Map<String, Object> suspiciousPayload(ScanTrackingRequestedEvent event, SuspicionAssessment suspicionAssessment) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("qr_code_id", event.qrCodeId());
        payload.put("scanned_at", event.scannedAt());
        payload.put("ip_address", event.ipAddress());
        payload.put("anomaly_reason", suspicionAssessment.reason());
        return payload;
    }
}
