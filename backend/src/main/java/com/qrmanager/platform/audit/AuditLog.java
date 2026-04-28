package com.qrmanager.platform.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
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
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, length = 120)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 120)
    private String entityType;

    @Column(name = "entity_id", length = 120)
    private String entityId;

    @Column(name = "details_json", columnDefinition = "text")
    private String detailsJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void assignDefaults() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
