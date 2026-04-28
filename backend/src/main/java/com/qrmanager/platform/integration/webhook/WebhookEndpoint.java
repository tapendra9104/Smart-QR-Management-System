package com.qrmanager.platform.integration.webhook;

import com.qrmanager.platform.common.AuditableEntity;
import com.qrmanager.platform.user.User;
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
@Table(name = "webhooks")
public class WebhookEndpoint extends AuditableEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "target_url", nullable = false, columnDefinition = "text")
    private String targetUrl;

    @Column(name = "signing_secret", nullable = false, length = 255)
    private String signingSecret;

    @Column(name = "subscribed_events", nullable = false, columnDefinition = "text")
    private String subscribedEvents;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    @Column(name = "last_success_at")
    private Instant lastSuccessAt;

    @Column(name = "last_response_status")
    private Integer lastResponseStatus;

    @Column(name = "last_error", columnDefinition = "text")
    private String lastError;

    @PrePersist
    public void assignDefaults() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
