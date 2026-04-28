package com.qrmanager.platform.analytics;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ScanEventRepository extends JpaRepository<ScanEvent, UUID> {

    @EntityGraph(attributePaths = "qrCode")
    List<ScanEvent> findByUserIdOrderByScannedAtDesc(UUID userId);

    List<ScanEvent> findByQrCodeIdOrderByScannedAtDesc(UUID qrCodeId);

    long countByUserId(UUID userId);

    long countByQrCodeIdAndScannedAtAfter(UUID qrCodeId, Instant cutoff);

    long countByQrCodeIdAndIpAddressAndScannedAtAfter(UUID qrCodeId, String ipAddress, Instant cutoff);

    long deleteByScannedAtBefore(Instant cutoff);
}
