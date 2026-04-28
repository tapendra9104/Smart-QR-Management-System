package com.qrmanager.platform.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmanager.platform.messaging.MessagingTopology;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "app.messaging.enabled", havingValue = "true")
public class RabbitMessagingConfig {

    @Bean
    public TopicExchange eventsExchange() {
        return new TopicExchange(MessagingTopology.EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange deadLetterExchange() {
        return new TopicExchange(MessagingTopology.DEAD_LETTER_EXCHANGE, true, false);
    }

    @Bean
    public Queue scanTrackingQueue() {
        return QueueBuilder.durable(MessagingTopology.SCAN_TRACKING_QUEUE)
            .deadLetterExchange(MessagingTopology.DEAD_LETTER_EXCHANGE)
            .deadLetterRoutingKey(MessagingTopology.SCAN_TRACKING_ROUTING_KEY)
            .build();
    }

    @Bean
    public Queue scanTrackingDlq() {
        return QueueBuilder.durable(MessagingTopology.SCAN_TRACKING_DLQ).build();
    }

    @Bean
    public Queue auditLogQueue() {
        return QueueBuilder.durable(MessagingTopology.AUDIT_LOG_QUEUE)
            .deadLetterExchange(MessagingTopology.DEAD_LETTER_EXCHANGE)
            .deadLetterRoutingKey(MessagingTopology.AUDIT_LOG_ROUTING_KEY)
            .build();
    }

    @Bean
    public Queue auditLogDlq() {
        return QueueBuilder.durable(MessagingTopology.AUDIT_LOG_DLQ).build();
    }

    @Bean
    public Binding scanTrackingBinding(Queue scanTrackingQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(scanTrackingQueue)
            .to(eventsExchange)
            .with(MessagingTopology.SCAN_TRACKING_ROUTING_KEY);
    }

    @Bean
    public Binding scanTrackingDlqBinding(Queue scanTrackingDlq, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(scanTrackingDlq)
            .to(deadLetterExchange)
            .with(MessagingTopology.SCAN_TRACKING_ROUTING_KEY);
    }

    @Bean
    public Binding auditLogBinding(Queue auditLogQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(auditLogQueue)
            .to(eventsExchange)
            .with(MessagingTopology.AUDIT_LOG_ROUTING_KEY);
    }

    @Bean
    public Binding auditLogDlqBinding(Queue auditLogDlq, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(auditLogDlq)
            .to(deadLetterExchange)
            .with(MessagingTopology.AUDIT_LOG_ROUTING_KEY);
    }

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        return new RabbitAdmin(connectionFactory);
    }

    @Bean
    public MessageConverter rabbitMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter rabbitMessageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(rabbitMessageConverter);
        return rabbitTemplate;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
        ConnectionFactory connectionFactory,
        MessageConverter rabbitMessageConverter
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(rabbitMessageConverter);
        factory.setDefaultRequeueRejected(false);
        return factory;
    }
}
