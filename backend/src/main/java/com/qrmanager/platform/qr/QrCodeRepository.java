package com.qrmanager.platform.qr;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.Instant;
import java.util.UUID;

public interface QrCodeRepository extends JpaRepository<QrCodeEntity, UUID> {

    List<QrCodeEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Page<QrCodeEntity> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("select q from QrCodeEntity q where q.user.id = :userId and lower(q.name) like lower(concat('%', :search, '%')) order by q.createdAt desc")
    Page<QrCodeEntity> searchByUserIdAndName(@Param("userId") UUID userId, @Param("search") String search, Pageable pageable);

    Optional<QrCodeEntity> findByIdAndUserId(UUID id, UUID userId);

    Optional<QrCodeEntity> findByShortCode(String shortCode);

    boolean existsByShortCode(String shortCode);

    long countByUserId(UUID userId);

    List<QrCodeEntity> findByActiveTrueAndExpiresAtBefore(Instant threshold);

    @Modifying
    @Query("update QrCodeEntity qr set qr.totalScans = qr.totalScans + 1 where qr.id = :id")
    int incrementTotalScans(@Param("id") UUID id);
}
