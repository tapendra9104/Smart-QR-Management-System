package com.qrmanager.platform.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final ObjectMapper objectMapper;
    private final AuditLogPublisher auditLogPublisher;

    public void log(UUID userId, String action, String entityType, String entityId, Map<String, Object> details) {
        String detailsJson = null;
        if (details != null && !details.isEmpty()) {
            try {
                detailsJson = objectMapper.writeValueAsString(details);
            } catch (JsonProcessingException ignored) {
                detailsJson = "{\"serializationError\":true}";
            }
        }

        auditLogPublisher.publish(new AuditLogRequestedEvent(
            UUID.randomUUID(),
            userId,
            action,
            entityType,
            entityId,
            detailsJson
        ));
    }
}
