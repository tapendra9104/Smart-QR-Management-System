package com.qrmanager.platform.maintenance;

import com.qrmanager.platform.analytics.ScanEventRepository;
import com.qrmanager.platform.audit.AuditLogRepository;
import com.qrmanager.platform.config.AppProperties;
import com.qrmanager.platform.integration.apikey.ApiKeyRepository;
import com.qrmanager.platform.user.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class DataRetentionService {

    private final ScanEventRepository scanEventRepository;
    private final AuditLogRepository auditLogRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final AppProperties appProperties;

    @Scheduled(cron = "${APP_RETENTION_CLEANUP_CRON:0 0 3 * * *}")
    @Transactional
    public void cleanupExpiredData() {
        long deletedScans = scanEventRepository.deleteByScannedAtBefore(
            Instant.now().minus(appProperties.scanEventRetentionDays(), ChronoUnit.DAYS)
        );
        long deletedAuditLogs = auditLogRepository.deleteByCreatedAtBefore(
            Instant.now().minus(appProperties.auditLogRetentionDays(), ChronoUnit.DAYS)
        );
        long deletedRefreshTokens = refreshTokenRepository.deleteExpiredOrRevokedBefore(
            Instant.now().minus(appProperties.refreshTokenRetentionDays(), ChronoUnit.DAYS)
        );
        long deletedApiKeys = apiKeyRepository.deleteByRevokedAtBefore(
            Instant.now().minus(appProperties.refreshTokenRetentionDays(), ChronoUnit.DAYS)
        );

        if (deletedScans > 0 || deletedAuditLogs > 0 || deletedRefreshTokens > 0 || deletedApiKeys > 0) {
            log.info(
                "Retention cleanup removed {} scan events, {} audit logs, {} refresh tokens, and {} revoked API keys",
                deletedScans,
                deletedAuditLogs,
                deletedRefreshTokens,
                deletedApiKeys
            );
        }
    }
}
