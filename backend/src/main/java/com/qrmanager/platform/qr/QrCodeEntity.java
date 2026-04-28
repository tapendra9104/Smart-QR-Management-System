package com.qrmanager.platform.qr;

import com.qrmanager.platform.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
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
@Table(name = "qr_codes")
public class QrCodeEntity extends AuditableEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private com.qrmanager.platform.user.User user;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "short_code", nullable = false, unique = true, length = 32)
    private String shortCode;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private ContentType contentType;

    @Column(name = "destination_url", columnDefinition = "text")
    private String destinationUrl;

    @Column(name = "is_dynamic", nullable = false)
    private boolean dynamic;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "style_json", nullable = false, columnDefinition = "text")
    private String styleJson;

    @Column(name = "total_scans", nullable = false)
    private long totalScans;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Version
    private long version;

    @PrePersist
    public void assignDefaults() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
