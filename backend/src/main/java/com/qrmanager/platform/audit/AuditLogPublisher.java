package com.qrmanager.platform.audit;

import com.qrmanager.platform.config.AppProperties;
import com.qrmanager.platform.messaging.MessagingTopology;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogPublisher {

    private final AppProperties appProperties;
    private final ObjectProvider<RabbitTemplate> rabbitTemplateProvider;
    private final AuditLogProcessor auditLogProcessor;

    public void publish(AuditLogRequestedEvent event) {
        RabbitTemplate rabbitTemplate = rabbitTemplateProvider.getIfAvailable();
        if (appProperties.messagingEnabled() && rabbitTemplate != null) {
            rabbitTemplate.convertAndSend(MessagingTopology.EVENTS_EXCHANGE, MessagingTopology.AUDIT_LOG_ROUTING_KEY, event);
            return;
        }
        auditLogProcessor.process(event);
    }
}
