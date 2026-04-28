package com.qrmanager.platform.analytics;

import com.qrmanager.platform.messaging.MessagingTopology;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.messaging.enabled", havingValue = "true")
public class ScanEventMessageListener {

    private final ScanEventProcessor scanEventProcessor;

    @RabbitListener(queues = MessagingTopology.SCAN_TRACKING_QUEUE)
    public void handle(ScanTrackingRequestedEvent event) {
        scanEventProcessor.process(event);
    }
}
