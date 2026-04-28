package com.qrmanager.platform.analytics;

import com.qrmanager.platform.qr.QrCodeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "qr_scan_events")
public class ScanEvent {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "qr_code_id", nullable = false)
    private QrCodeEntity qrCode;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "scanned_at", nullable = false)
    private Instant scannedAt;

    @Column(name = "ip_address", length = 120)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "text")
    private String userAgent;

    @Column(length = 120)
    private String referer;

    @Column(length = 120)
    private String country;

    @Column(length = 120)
    private String city;

    @Column(name = "device_type", length = 40)
    private String deviceType;

    @Column(name = "is_suspicious", nullable = false)
    private boolean suspicious;

    @Column(name = "anomaly_reason", length = 255)
    private String anomalyReason;

    @Column(length = 80)
    private String browser;

    @Column(length = 80)
    private String os;

    @PrePersist
    public void assignDefaults() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (scannedAt == null) {
            scannedAt = Instant.now();
        }
    }
}
