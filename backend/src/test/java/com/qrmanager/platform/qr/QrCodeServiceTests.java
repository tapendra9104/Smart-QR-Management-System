package com.qrmanager.platform.qr;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmanager.platform.audit.AuditService;
import com.qrmanager.platform.common.BadRequestException;
import com.qrmanager.platform.common.ResourceNotFoundException;
import com.qrmanager.platform.config.AppProperties;
import com.qrmanager.platform.integration.UsageLimitService;
import com.qrmanager.platform.integration.webhook.WebhookDispatchService;
import com.qrmanager.platform.qr.dto.CreateQrCodeRequest;
import com.qrmanager.platform.qr.dto.QrCodeResponse;
import com.qrmanager.platform.qr.dto.QrCodeStyleDto;
import com.qrmanager.platform.qr.dto.UpdateQrCodeRequest;
import com.qrmanager.platform.user.Role;
import com.qrmanager.platform.user.User;
import com.qrmanager.platform.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for QrCodeService — all dependencies are mocked via Mockito.
 * No database, no Spring context: these run in milliseconds.
 */
@ExtendWith(MockitoExtension.class)
class QrCodeServiceTests {

    @Mock QrCodeRepository qrCodeRepository;
    @Mock UserRepository userRepository;
    @Mock ShortCodeGenerator shortCodeGenerator;
    @Mock AuditService auditService;
    @Mock AppProperties appProperties;
    @Mock RedirectUrlSigner redirectUrlSigner;
    @Mock UsageLimitService usageLimitService;
    @Mock WebhookDispatchService webhookDispatchService;

    private QrCodeService qrCodeService;

    @BeforeEach
    void setUp() {
        // Use a real ObjectMapper so JSON serialization actually works in unit tests
        qrCodeService = new QrCodeService(
            qrCodeRepository,
            userRepository,
            new ObjectMapper(),
            shortCodeGenerator,
            auditService,
            appProperties,
            redirectUrlSigner,
            usageLimitService,
            webhookDispatchService
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User buildUser(UUID id) {
        return User.builder()
            .id(id)
            .email("user-" + id + "@example.com")
            .fullName("Test User")
            .passwordHash("hashed")
            .role(Role.USER)
            .enabled(true)
            .build();
    }

    private QrCodeStyleDto defaultStyle() {
        return new QrCodeStyleDto("#000000", "#ffffff", 256, 16, "M", "squares", 0, null, 60, 60, 1.0, true);
    }

    private QrCodeEntity buildEntity(UUID id, UUID userId, String shortCode, String content, boolean isDynamic) {
        User user = buildUser(userId);
        return QrCodeEntity.builder()
            .id(id)
            .user(user)
            .name("Test QR")
            .shortCode(shortCode)
            .content(content)
            .contentType(ContentType.URL)
            .destinationUrl(content)
            .dynamic(isDynamic)
            .active(true)
            .totalScans(0)
            .styleJson("{\"fg_color\":\"#000000\",\"bg_color\":\"#ffffff\",\"size\":256,\"quiet_zone\":16,\"ec_level\":\"M\",\"qr_style\":\"squares\",\"eye_radius\":0,\"logo_width\":60,\"logo_height\":60,\"logo_opacity\":1.0,\"remove_qr_code_behind_logo\":true}")
            .build();
    }

    private void stubCreate(UUID userId, String shortCode, QrCodeEntity saved) {
        when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(userId)));
        when(shortCodeGenerator.generate()).thenReturn(shortCode);
        when(qrCodeRepository.existsByShortCode(shortCode)).thenReturn(false);
        when(qrCodeRepository.save(any(QrCodeEntity.class))).thenReturn(saved);
        when(redirectUrlSigner.buildSignedResolveUrl(any(), anyString()))
            .thenReturn("https://app.example.com/r/" + shortCode + "?sig=test");
    }

    // ─── createForUser ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createForUser()")
    class CreateForUser {

        @Test
        @DisplayName("Happy path: creates a static URL QR code")
        void createsStaticUrlQrCode() {
            UUID userId = UUID.randomUUID();
            UUID qrId = UUID.randomUUID();
            String shortCode = "abc123";
            QrCodeEntity saved = buildEntity(qrId, userId, shortCode, "https://example.com", false);
            stubCreate(userId, shortCode, saved);
            when(appProperties.frontendUrl()).thenReturn("https://app.example.com");

            CreateQrCodeRequest request = new CreateQrCodeRequest(
                "My QR", "https://example.com", "url", null, false, defaultStyle(), null, null
            );

            QrCodeResponse response = qrCodeService.createForUser(userId, request);

            assertThat(response.id()).isEqualTo(qrId);
            assertThat(response.shortCode()).isEqualTo(shortCode);
            assertThat(response.content()).isEqualTo("https://example.com");
            verify(qrCodeRepository).save(any(QrCodeEntity.class));
        }

        @Test
        @DisplayName("Throws BadRequestException for non-HTTP URL scheme")
        void rejectsNonHttpUrl() {
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(userId)));
            // Note: shortCodeGenerator is NOT stubbed — validation fails before short code is generated

            CreateQrCodeRequest request = new CreateQrCodeRequest(
                "Bad QR", "javascript:alert('xss')", "url", null, false, defaultStyle(), null, null
            );

            assertThatThrownBy(() -> qrCodeService.createForUser(userId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("valid website URL");

            verify(qrCodeRepository, never()).save(any());
        }

        @Test
        @DisplayName("Throws BadRequestException for ftp:// URL")
        void rejectsFtpUrl() {
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(userId)));
            // Note: shortCodeGenerator is NOT stubbed — validation fails before short code is generated

            CreateQrCodeRequest request = new CreateQrCodeRequest(
                "FTP QR", "ftp://files.example.com", "url", null, false, defaultStyle(), null, null
            );

            assertThatThrownBy(() -> qrCodeService.createForUser(userId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("valid website URL");
        }

        @Test
        @DisplayName("Throws BadRequestException for blank URL content")
        void rejectsBlankUrl() {
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(userId)));
            // Note: shortCodeGenerator is NOT stubbed — validation fails before short code is generated

            CreateQrCodeRequest request = new CreateQrCodeRequest(
                "Blank QR", "   ", "url", null, false, defaultStyle(), null, null
            );

            assertThatThrownBy(() -> qrCodeService.createForUser(userId, request))
                .isInstanceOf(BadRequestException.class);
        }

        @Test
        @DisplayName("Throws BadRequestException when expiry is before start time")
        void rejectsInvalidLifecycleWindow() {
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(userId)));
            // Note: shortCodeGenerator is NOT stubbed — lifecycle validation fails before short code is generated

            Instant start = Instant.now().plusSeconds(3600);
            Instant expiry = Instant.now().plusSeconds(1800); // expires BEFORE start

            CreateQrCodeRequest request = new CreateQrCodeRequest(
                "Bad Window", "https://example.com", "url", null, true, defaultStyle(), start, expiry
            );

            assertThatThrownBy(() -> qrCodeService.createForUser(userId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Expiry must be after the start time");
        }

        @Test
        @DisplayName("Propagates usage limit check — throws when limit exceeded")
        void propagatesUsageLimitException() {
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(userId)));
            doThrow(new BadRequestException("QR code limit reached"))
                .when(usageLimitService).assertCanCreateQrCode(userId);

            CreateQrCodeRequest request = new CreateQrCodeRequest(
                "Over Limit", "https://example.com", "url", null, false, defaultStyle(), null, null
            );

            assertThatThrownBy(() -> qrCodeService.createForUser(userId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("limit");

            verify(qrCodeRepository, never()).save(any());
        }

        @Test
        @DisplayName("Retries short code generation if first candidate is taken")
        void retriesShortCodeOnCollision() {
            UUID userId = UUID.randomUUID();
            UUID qrId = UUID.randomUUID();

            when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(userId)));
            // First call returns a taken code, second call returns a free one
            when(shortCodeGenerator.generate()).thenReturn("taken1", "free22");
            when(qrCodeRepository.existsByShortCode("taken1")).thenReturn(true);
            when(qrCodeRepository.existsByShortCode("free22")).thenReturn(false);

            QrCodeEntity saved = buildEntity(qrId, userId, "free22", "https://example.com", false);
            when(qrCodeRepository.save(any(QrCodeEntity.class))).thenReturn(saved);
            when(appProperties.frontendUrl()).thenReturn("https://app.example.com");
            when(redirectUrlSigner.buildSignedResolveUrl(any(), anyString()))
                .thenReturn("https://app.example.com/r/free22?sig=test");

            CreateQrCodeRequest request = new CreateQrCodeRequest(
                "My QR", "https://example.com", "url", null, false, defaultStyle(), null, null
            );
            QrCodeResponse response = qrCodeService.createForUser(userId, request);

            assertThat(response.shortCode()).isEqualTo("free22");
            verify(shortCodeGenerator, times(2)).generate();
        }

        @Test
        @DisplayName("Throws BadRequestException after 10 short code collision attempts")
        void failsAfterTenCollisions() {
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.of(buildUser(userId)));
            when(shortCodeGenerator.generate()).thenReturn("taken");
            when(qrCodeRepository.existsByShortCode("taken")).thenReturn(true);

            CreateQrCodeRequest request = new CreateQrCodeRequest(
                "My QR", "https://example.com", "url", null, false, defaultStyle(), null, null
            );

            assertThatThrownBy(() -> qrCodeService.createForUser(userId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("unique short code");
        }

        @Test
        @DisplayName("Fires webhook after successful create")
        void firesWebhookOnCreate() {
            UUID userId = UUID.randomUUID();
            UUID qrId = UUID.randomUUID();
            String shortCode = "wh1234";
            QrCodeEntity saved = buildEntity(qrId, userId, shortCode, "https://example.com", true);
            stubCreate(userId, shortCode, saved);
            when(appProperties.frontendUrl()).thenReturn("https://app.example.com");

            CreateQrCodeRequest request = new CreateQrCodeRequest(
                "Webhook QR", "https://example.com", "url", null, true, defaultStyle(), null, null
            );
            qrCodeService.createForUser(userId, request);

            verify(webhookDispatchService).dispatchAsync(eq(userId), any(), any());
        }
    }

    // ─── deleteForUser ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteForUser()")
    class DeleteForUser {

        @Test
        @DisplayName("Deletes existing QR code and fires webhook")
        void deletesAndFiresWebhook() {
            UUID userId = UUID.randomUUID();
            UUID qrId = UUID.randomUUID();
            QrCodeEntity entity = buildEntity(qrId, userId, "del123", "https://example.com", false);
            when(qrCodeRepository.findByIdAndUserId(qrId, userId)).thenReturn(Optional.of(entity));

            qrCodeService.deleteForUser(userId, qrId);

            verify(qrCodeRepository).delete(entity);
            verify(webhookDispatchService).dispatchAsync(eq(userId), any(), any());
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException for non-existent QR code")
        void throwsForMissingQrCode() {
            UUID userId = UUID.randomUUID();
            UUID qrId = UUID.randomUUID();
            when(qrCodeRepository.findByIdAndUserId(qrId, userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> qrCodeService.deleteForUser(userId, qrId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");
        }
    }

    // ─── getActiveByShortCode ─────────────────────────────────────────────────

    @Nested
    @DisplayName("getActiveByShortCode()")
    class GetActiveByShortCode {

        @Test
        @DisplayName("Returns entity for an active, non-expired QR code")
        void returnsActiveQrCode() {
            UUID userId = UUID.randomUUID();
            QrCodeEntity entity = buildEntity(UUID.randomUUID(), userId, "act123", "https://example.com", true);
            when(qrCodeRepository.findByShortCode("act123")).thenReturn(Optional.of(entity));

            QrCodeEntity result = qrCodeService.getActiveByShortCode("act123");
            assertThat(result.getShortCode()).isEqualTo("act123");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException for inactive QR code")
        void throwsForInactiveCode() {
            UUID userId = UUID.randomUUID();
            QrCodeEntity entity = buildEntity(UUID.randomUUID(), userId, "off123", "https://example.com", true);
            entity.setActive(false);
            when(qrCodeRepository.findByShortCode("off123")).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> qrCodeService.getActiveByShortCode("off123"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("inactive");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException for expired QR code")
        void throwsForExpiredCode() {
            UUID userId = UUID.randomUUID();
            QrCodeEntity entity = buildEntity(UUID.randomUUID(), userId, "exp123", "https://example.com", true);
            entity.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS)); // already expired
            when(qrCodeRepository.findByShortCode("exp123")).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> qrCodeService.getActiveByShortCode("exp123"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("expired");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException for QR code not started yet")
        void throwsForFutureCode() {
            UUID userId = UUID.randomUUID();
            QrCodeEntity entity = buildEntity(UUID.randomUUID(), userId, "fut123", "https://example.com", true);
            entity.setStartsAt(Instant.now().plus(1, ChronoUnit.HOURS)); // starts in the future
            when(qrCodeRepository.findByShortCode("fut123")).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> qrCodeService.getActiveByShortCode("fut123"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not active yet");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException for unknown short code")
        void throwsForUnknownCode() {
            when(qrCodeRepository.findByShortCode("unk999")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> qrCodeService.getActiveByShortCode("unk999"))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
