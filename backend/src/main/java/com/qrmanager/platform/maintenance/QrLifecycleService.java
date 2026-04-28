package com.qrmanager.platform.maintenance;

import com.qrmanager.platform.audit.AuditService;
import com.qrmanager.platform.integration.webhook.WebhookDispatchService;
import com.qrmanager.platform.integration.webhook.WebhookEventType;
import com.qrmanager.platform.qr.QrCodeEntity;
import com.qrmanager.platform.qr.QrCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class QrLifecycleService {

    private final QrCodeRepository qrCodeRepository;
    private final AuditService auditService;
    private final WebhookDispatchService webhookDispatchService;

    @Scheduled(cron = "${APP_QR_LIFECYCLE_CRON:0 */10 * * * *}")
    @Transactional
    @CacheEvict(cacheNames = "qrByShortCode", allEntries = true)
    public void deactivateExpiredCodes() {
        var expiredCodes = qrCodeRepository.findByActiveTrueAndExpiresAtBefore(Instant.now());
        for (QrCodeEntity qrCode : expiredCodes) {
            qrCode.setActive(false);
            auditService.log(qrCode.getUser().getId(), "QR_EXPIRED", "QR_CODE", qrCode.getId().toString(), Map.of(
                "shortCode", qrCode.getShortCode(),
                "expiredAt", qrCode.getExpiresAt()
            ));
            webhookDispatchService.dispatchAsync(qrCode.getUser().getId(), WebhookEventType.QR_EXPIRED, Map.of(
                "qr_code_id", qrCode.getId(),
                "short_code", qrCode.getShortCode(),
                "name", qrCode.getName(),
                "expired_at", qrCode.getExpiresAt()
            ));
        }
        if (!expiredCodes.isEmpty()) {
            log.info("Deactivated {} expired QR codes", expiredCodes.size());
        }
    }
}
