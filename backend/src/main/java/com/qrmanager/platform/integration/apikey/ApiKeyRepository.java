package com.qrmanager.platform.integration.apikey;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {

    List<ApiKey> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<ApiKey> findByIdAndUserId(UUID id, UUID userId);

    @EntityGraph(attributePaths = "user")
    Optional<ApiKey> findByKeyHash(String keyHash);

    long countByUserIdAndRevokedAtIsNull(UUID userId);

    long deleteByRevokedAtBefore(Instant cutoff);
}
