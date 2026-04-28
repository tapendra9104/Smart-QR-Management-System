package com.qrmanager.platform.qr;

import com.qrmanager.platform.analytics.AnalyticsService;
import com.qrmanager.platform.analytics.ScanEventRepository;
import com.qrmanager.platform.audit.AuditLogRepository;
import com.qrmanager.platform.common.BadRequestException;
import com.qrmanager.platform.qr.dto.CreateQrCodeRequest;
import com.qrmanager.platform.qr.dto.QrCodeResponse;
import com.qrmanager.platform.qr.dto.QrCodeStyleDto;
import com.qrmanager.platform.user.RefreshTokenRepository;
import com.qrmanager.platform.user.Role;
import com.qrmanager.platform.user.User;
import com.qrmanager.platform.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class QrFlowRegressionTests {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private QrCodeService qrCodeService;

    @Autowired
    private RedirectUrlSigner redirectUrlSigner;

    @Autowired
    private ScanEventRepository scanEventRepository;

    @Autowired
    private QrCodeRepository qrCodeRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @AfterEach
    void cleanUp() {
        scanEventRepository.deleteAll();
        qrCodeRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        auditLogRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void tracksHumanGetRequests() {
        User user = createUser();
        QrCodeResponse code = createDynamicUrlCode(user.getId(), "https://example.com/human");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/public/qr/" + code.shortCode() + "/resolve");
        request.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36");
        request.setRemoteAddr("203.0.113.10");

        String destination = analyticsService.resolveAndTrack(
            code.shortCode(),
            redirectUrlSigner.signatureFor(code.shortCode()),
            request
        );

        assertThat(destination).isEqualTo("https://example.com/human");
        assertThat(scanEventRepository.findByQrCodeIdOrderByScannedAtDesc(code.id())).hasSize(1);
    }

    @Test
    void doesNotTrackHeadRequestsForwardedByEdgeRoute() {
        User user = createUser();
        QrCodeResponse code = createDynamicUrlCode(user.getId(), "https://example.com/head");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/public/qr/" + code.shortCode() + "/resolve");
        request.addHeader("X-Original-Method", "HEAD");
        request.addHeader("User-Agent", "curl/8.6.0");
        request.setRemoteAddr("203.0.113.11");

        String destination = analyticsService.resolveAndTrack(
            code.shortCode(),
            redirectUrlSigner.signatureFor(code.shortCode()),
            request
        );

        assertThat(destination).isEqualTo("https://example.com/head");
        assertThat(scanEventRepository.findByQrCodeIdOrderByScannedAtDesc(code.id())).isEmpty();
    }

    @Test
    void doesNotTrackKnownBotUserAgents() {
        User user = createUser();
        QrCodeResponse code = createDynamicUrlCode(user.getId(), "https://example.com/bot");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/public/qr/" + code.shortCode() + "/resolve");
        request.addHeader("User-Agent", "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)");
        request.setRemoteAddr("203.0.113.12");

        String destination = analyticsService.resolveAndTrack(
            code.shortCode(),
            redirectUrlSigner.signatureFor(code.shortCode()),
            request
        );

        assertThat(destination).isEqualTo("https://example.com/bot");
        assertThat(scanEventRepository.findByQrCodeIdOrderByScannedAtDesc(code.id())).isEmpty();
    }

    @Test
    void staticUrlCodesStillResolveThroughTrackedRedirects() {
        User user = createUser();
        QrCodeResponse code = qrCodeService.createForUser(user.getId(), new CreateQrCodeRequest(
            "Static QR",
            "https://example.com/static",
            "url",
            null,
            false,
            defaultStyle(),
            null,
            null
        ));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/public/qr/" + code.shortCode() + "/resolve");
        request.addHeader("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1");
        request.setRemoteAddr("203.0.113.15");

        String destination = analyticsService.resolveAndTrack(
            code.shortCode(),
            redirectUrlSigner.signatureFor(code.shortCode()),
            request
        );

        assertThat(code.qrPayload()).contains("/r/");
        assertThat(destination).isEqualTo("https://example.com/static");
        assertThat(scanEventRepository.findByQrCodeIdOrderByScannedAtDesc(code.id())).hasSize(1);
    }

    @Test
    void rejectsCodesThatHaveNotStartedYet() {
        User user = createUser();
        QrCodeResponse code = qrCodeService.createForUser(user.getId(), new CreateQrCodeRequest(
            "Scheduled QR",
            "https://example.com/future",
            "url",
            null,
            true,
            defaultStyle(),
            Instant.now().plusSeconds(3600),
            Instant.now().plusSeconds(7200)
        ));

        assertThatThrownBy(() -> qrCodeService.getActiveByShortCode(code.shortCode()))
            .isInstanceOf(com.qrmanager.platform.common.ResourceNotFoundException.class)
            .hasMessage("QR code is not active yet");
    }

    @Test
    void rejectsInvalidUrlContent() {
        User user = createUser();

        assertThatThrownBy(() -> qrCodeService.createForUser(user.getId(), new CreateQrCodeRequest(
            "Unsafe QR",
            "javascript:alert('xss')",
            "url",
            null,
            false,
            defaultStyle(),
            null,
            null
        )))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Please enter a valid website URL");
    }

    private User createUser() {
        return userRepository.save(User.builder()
            .email("audit-" + UUID.randomUUID() + "@example.com")
            .fullName("Audit User")
            .passwordHash("hashed-password")
            .role(Role.ADMIN)
            .enabled(true)
            .build());
    }

    private QrCodeResponse createDynamicUrlCode(UUID userId, String destinationUrl) {
        return qrCodeService.createForUser(userId, new CreateQrCodeRequest(
            "Regression QR",
            destinationUrl,
            "url",
            null,
            true,
            defaultStyle(),
            null,
            null
        ));
    }

    private QrCodeStyleDto defaultStyle() {
        return new QrCodeStyleDto(
            "#000000",
            "#ffffff",
            256,
            16,
            "M",
            "squares",
            0,
            null,
            60,
            60,
            1.0,
            true
        );
    }
}
