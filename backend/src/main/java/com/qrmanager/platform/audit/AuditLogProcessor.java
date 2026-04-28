package com.qrmanager.platform.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuditLogProcessor {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Retryable(
        retryFor = Exception.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 250, multiplier = 2.0)
    )
    public void process(AuditLogRequestedEvent event) {
        if (auditLogRepository.existsById(event.eventId())) {
            return;
        }

        auditLogRepository.save(AuditLog.builder()
            .id(event.eventId())
            .userId(event.userId())
            .action(event.action())
            .entityType(event.entityType())
            .entityId(event.entityId())
            .detailsJson(event.detailsJson())
            .build());
    }

    @Recover
    public void recover(Exception exception, AuditLogRequestedEvent event) {
        log.error("Failed to persist audit event {} for {}", event.action(), event.entityId(), exception);
    }
}
