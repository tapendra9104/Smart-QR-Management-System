package com.qrmanager.platform.integration.webhook;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebhookRepository extends JpaRepository<WebhookEndpoint, UUID> {

    List<WebhookEndpoint> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<WebhookEndpoint> findByIdAndUserId(UUID id, UUID userId);

    List<WebhookEndpoint> findByUserIdAndActiveTrue(UUID userId);

    long countByUserIdAndActiveTrue(UUID userId);
}
