package com.qrmanager.platform.audit;

import java.util.UUID;

public record AuditLogRequestedEvent(
    UUID eventId,
    UUID userId,
    String action,
    String entityType,
    String entityId,
    String detailsJson
) {
}
