package com.qrmanager.platform.export;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmanager.platform.analytics.ScanEvent;
import com.qrmanager.platform.analytics.ScanEventRepository;
import com.qrmanager.platform.audit.AuditLog;
import com.qrmanager.platform.audit.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExportService {

    private final ScanEventRepository scanEventRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public String exportScanEventsCsv(UUID userId) {
        List<ScanEvent> events = scanEventRepository.findByUserIdOrderByScannedAtDesc(userId);
        StringBuilder builder = new StringBuilder("event_id,qr_code_id,scanned_at,country,city,device_type,browser,os,is_suspicious,anomaly_reason\n");
        events.forEach(event -> builder
            .append(csv(event.getId()))
            .append(',')
            .append(csv(event.getQrCode().getId()))
            .append(',')
            .append(csv(event.getScannedAt()))
            .append(',')
            .append(csv(event.getCountry()))
            .append(',')
            .append(csv(event.getCity()))
            .append(',')
            .append(csv(event.getDeviceType()))
            .append(',')
            .append(csv(event.getBrowser()))
            .append(',')
            .append(csv(event.getOs()))
            .append(',')
            .append(csv(event.isSuspicious()))
            .append(',')
            .append(csv(event.getAnomalyReason()))
            .append('\n'));
        return builder.toString();
    }

    public String exportAuditLogsCsv(UUID userId) {
        List<AuditLog> logs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
        StringBuilder builder = new StringBuilder("audit_id,created_at,action,entity_type,entity_id,details_json\n");
        logs.forEach(log -> builder
            .append(csv(log.getId()))
            .append(',')
            .append(csv(log.getCreatedAt()))
            .append(',')
            .append(csv(log.getAction()))
            .append(',')
            .append(csv(log.getEntityType()))
            .append(',')
            .append(csv(log.getEntityId()))
            .append(',')
            .append(csv(log.getDetailsJson()))
            .append('\n'));
        return builder.toString();
    }

    public String exportScanEventsJson(UUID userId) {
        return writeJson(scanEventRepository.findByUserIdOrderByScannedAtDesc(userId)
            .stream()
            .map(this::toScanEventMap)
            .toList());
    }

    public String exportAuditLogsJson(UUID userId) {
        return writeJson(auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toAuditLogMap)
            .toList());
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to export data", exception);
        }
    }

    private String csv(Object value) {
        if (value == null) {
            return "";
        }
        String normalized = value.toString().replace("\"", "\"\"");
        return "\"" + normalized + "\"";
    }

    private Map<String, Object> toScanEventMap(ScanEvent event) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("event_id", event.getId());
        result.put("qr_code_id", event.getQrCode().getId());
        result.put("scanned_at", event.getScannedAt());
        result.put("country", event.getCountry());
        result.put("city", event.getCity());
        result.put("device_type", event.getDeviceType());
        result.put("browser", event.getBrowser());
        result.put("os", event.getOs());
        result.put("is_suspicious", event.isSuspicious());
        result.put("anomaly_reason", event.getAnomalyReason());
        return result;
    }

    private Map<String, Object> toAuditLogMap(AuditLog log) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("audit_id", log.getId());
        result.put("created_at", log.getCreatedAt());
        result.put("action", log.getAction());
        result.put("entity_type", log.getEntityType());
        result.put("entity_id", log.getEntityId());
        result.put("details_json", log.getDetailsJson());
        return result;
    }
}
