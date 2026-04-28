package com.qrmanager.platform.audit;

import com.qrmanager.platform.messaging.MessagingTopology;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.messaging.enabled", havingValue = "true")
public class AuditLogMessageListener {

    private final AuditLogProcessor auditLogProcessor;

    @RabbitListener(queues = MessagingTopology.AUDIT_LOG_QUEUE)
    public void handle(AuditLogRequestedEvent event) {
        auditLogProcessor.process(event);
    }
}
