package com.qrmanager.platform.analytics;

import com.qrmanager.platform.config.AppProperties;
import com.qrmanager.platform.messaging.MessagingTopology;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ScanEventPublisher {

    private final AppProperties appProperties;
    private final ObjectProvider<RabbitTemplate> rabbitTemplateProvider;
    private final ScanEventProcessor scanEventProcessor;

    public void publish(ScanTrackingRequestedEvent event) {
        RabbitTemplate rabbitTemplate = rabbitTemplateProvider.getIfAvailable();
        if (appProperties.messagingEnabled() && rabbitTemplate != null) {
            rabbitTemplate.convertAndSend(MessagingTopology.EVENTS_EXCHANGE, MessagingTopology.SCAN_TRACKING_ROUTING_KEY, event);
            return;
        }
        scanEventProcessor.process(event);
    }
}
