package com.qrmanager.platform.integration.webhook;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class WebhookDispatchService {

    private final WebhookRepository webhookRepository;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<WebhookDispatchService> selfProvider;
    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();

    @Async("applicationTaskExecutor")
    public void dispatchAsync(UUID userId, WebhookEventType eventType, Map<String, Object> payload) {
        List<WebhookEndpoint> endpoints = webhookRepository.findByUserIdAndActiveTrue(userId);
        endpoints.stream()
            .filter(endpoint -> isSubscribed(endpoint, eventType))
            .forEach(endpoint -> selfProvider.getObject().sendWithRetry(endpoint.getId(), eventType, payload));
    }

    @Retryable(
        retryFor = Exception.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 500, multiplier = 2.0)
    )
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendWithRetry(UUID endpointId, WebhookEventType eventType, Map<String, Object> payload) {
        WebhookEndpoint endpoint = webhookRepository.findById(endpointId)
            .orElseThrow();
        String body = serializeBody(eventType, endpoint, payload);
        Instant now = Instant.now();
        endpoint.setLastAttemptAt(now);

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint.getTargetUrl()))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("User-Agent", "SEQ-LAMS-Webhooks/1.0")
                .header("X-SEQ-LAMS-Event", eventType.wireValue())
                .header("X-SEQ-LAMS-Delivery", UUID.randomUUID().toString())
                .header("X-SEQ-LAMS-Signature", sign(body, endpoint.getSigningSecret()))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            endpoint.setLastResponseStatus(response.statusCode());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                endpoint.setLastSuccessAt(now);
                endpoint.setLastError(null);
            } else {
                endpoint.setLastError(trimError("Webhook returned " + response.statusCode() + ": " + response.body()));
                throw new IllegalStateException("Webhook returned status " + response.statusCode());
            }
        } catch (Exception exception) {
            endpoint.setLastError(trimError(exception.getMessage()));
            webhookRepository.save(endpoint);
            throw new IllegalStateException("Webhook delivery failed", exception);
        }

        webhookRepository.save(endpoint);
    }

    @Recover
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recover(Exception exception, UUID endpointId, WebhookEventType eventType, Map<String, Object> payload) {
        webhookRepository.findById(endpointId).ifPresent(endpoint -> {
            endpoint.setLastError(trimError(exception.getMessage()));
            webhookRepository.save(endpoint);
        });
        log.warn("Webhook delivery permanently failed for endpoint {} event {}", endpointId, eventType.wireValue(), exception);
    }

    private boolean isSubscribed(WebhookEndpoint endpoint, WebhookEventType eventType) {
        return readSubscribedEvents(endpoint).stream().anyMatch(value -> value.equalsIgnoreCase(eventType.wireValue()));
    }

    private List<String> readSubscribedEvents(WebhookEndpoint endpoint) {
        try {
            return objectMapper.readValue(
                endpoint.getSubscribedEvents(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String serializeBody(WebhookEventType eventType, WebhookEndpoint endpoint, Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                "event", eventType.wireValue(),
                "webhook_id", endpoint.getId(),
                "sent_at", Instant.now(),
                "data", payload
            ));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize webhook payload", exception);
        }
    }

    private String sign(String body, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign webhook payload", exception);
        }
    }

    private String trimError(String value) {
        if (value == null) {
            return null;
        }
        return value.length() > 1000 ? value.substring(0, 1000) : value;
    }
}
