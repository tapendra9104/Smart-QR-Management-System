package com.qrmanager.platform;

import com.qrmanager.platform.audit.AuditLogRepository;
import com.qrmanager.platform.integration.apikey.ApiKeyRepository;
import com.qrmanager.platform.integration.webhook.WebhookRepository;
import com.qrmanager.platform.qr.QrCodeRepository;
import com.qrmanager.platform.user.RefreshTokenRepository;
import com.qrmanager.platform.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.ParameterizedTypeReference;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiHttpIntegrationTests {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_RESPONSE =
        new ParameterizedTypeReference<>() {
        };
    private static final ParameterizedTypeReference<List<String>> STRING_LIST_RESPONSE =
        new ParameterizedTypeReference<>() {
        };

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ApiKeyRepository apiKeyRepository;

    @Autowired
    private WebhookRepository webhookRepository;

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
        apiKeyRepository.deleteAll();
        webhookRepository.deleteAll();
        qrCodeRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        auditLogRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void supportsCoreEnterpriseFlowOverHttp() throws Exception {
        String baseUrl = "http://localhost:" + port;

        ResponseEntity<Map<String, Object>> registerResponse = post(
            baseUrl + "/api/v1/auth/register",
            Map.of(
                "email", "http-smoke-" + System.currentTimeMillis() + "@example.com",
                "password", "Password123!",
                "full_name", "HTTP Smoke"
            ),
            null
        );
        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        String accessToken = (String) registerResponse.getBody().get("access_token");
        String refreshToken = (String) registerResponse.getBody().get("refresh_token");
        Map<?, ?> registeredUser = (Map<?, ?>) registerResponse.getBody().get("user");
        assertThat(accessToken).isNotBlank();
        assertThat(refreshToken).isNotBlank();

        ResponseEntity<Map<String, Object>> firstRefresh = post(
            baseUrl + "/api/v1/auth/refresh",
            Map.of("refresh_token", refreshToken),
            null
        );
        ResponseEntity<Map<String, Object>> secondRefresh = post(
            baseUrl + "/api/v1/auth/refresh",
            Map.of("refresh_token", refreshToken),
            null
        );
        assertThat(firstRefresh.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(secondRefresh.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(firstRefresh.getBody().get("refresh_token")).isEqualTo(refreshToken);
        assertThat(secondRefresh.getBody().get("refresh_token")).isEqualTo(refreshToken);

        Map<String, Object> qrCreateRequest = new LinkedHashMap<>();
        qrCreateRequest.put("name", "HTTP Static QR");
        qrCreateRequest.put("content", "https://example.com/http-static");
        qrCreateRequest.put("content_type", "url");
        qrCreateRequest.put("destination_url", null);
        qrCreateRequest.put("is_dynamic", false);
        qrCreateRequest.put("style", defaultStyle());

        ResponseEntity<Map<String, Object>> qrResponse = post(
            baseUrl + "/api/v1/qr-codes",
            qrCreateRequest,
            bearer(accessToken)
        );
        assertThat(qrResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(qrResponse.getBody().get("content")).isEqualTo("https://example.com/http-static");
        assertThat((String) qrResponse.getBody().get("qr_payload")).contains("/r/");

        String qrPayload = (String) qrResponse.getBody().get("qr_payload");
        String shortCode = (String) qrResponse.getBody().get("short_code");
        String qrId = qrResponse.getBody().get("id").toString();
        String signature = URI.create(qrPayload).getQuery().replace("sig=", "");

        HttpHeaders publicHeaders = new HttpHeaders();
        publicHeaders.set("User-Agent", "Mozilla/5.0 HTTP Smoke");

        ResponseEntity<Map<String, Object>> resolveResponse = getMap(
            baseUrl + "/api/v1/public/qr/" + shortCode + "/resolve?sig=" + signature,
            publicHeaders
        );
        assertThat(resolveResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resolveResponse.getBody().get("redirect_url")).isEqualTo("https://example.com/http-static");

        HttpHeaders malformedForwardedHeaders = new HttpHeaders(publicHeaders);
        malformedForwardedHeaders.set("X-Forwarded-For", "::1:60687");
        malformedForwardedHeaders.set("X-Original-Method", "HEAD");
        ResponseEntity<Map<String, Object>> forwardedResolveResponse = getMap(
            baseUrl + "/api/v1/public/qr/" + shortCode + "/resolve?sig=" + signature,
            malformedForwardedHeaders
        );
        assertThat(forwardedResolveResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(forwardedResolveResponse.getBody().get("redirect_url")).isEqualTo("https://example.com/http-static");

        Map<String, Object> analyticsPayload = pollForAnalytics(baseUrl, accessToken, qrId, 1);
        assertThat(analyticsPayload.get("total_scans")).isEqualTo(1);

        ResponseEntity<Map<String, Object>> apiKeyResponse = post(
            baseUrl + "/api/v1/integrations/api-keys",
            Map.of("name", "HTTP API Key"),
            bearer(accessToken)
        );
        assertThat(apiKeyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String plaintextApiKey = (String) apiKeyResponse.getBody().get("plaintext_key");
        assertThat(plaintextApiKey).startsWith("seq_");

        HttpHeaders apiKeyHeaders = new HttpHeaders();
        apiKeyHeaders.set("Authorization", "ApiKey " + plaintextApiKey);
        ResponseEntity<Map<String, Object>> meViaApiKey = getMap(
            baseUrl + "/api/v1/auth/me",
            apiKeyHeaders
        );
        assertThat(meViaApiKey.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(meViaApiKey.getBody().get("email")).isEqualTo(registeredUser.get("email"));

        ResponseEntity<List<String>> webhookEventsResponse = restTemplate.exchange(
            baseUrl + "/api/v1/integrations/webhooks/events",
            HttpMethod.GET,
            new HttpEntity<>(bearer(accessToken)),
            STRING_LIST_RESPONSE
        );
        assertThat(webhookEventsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(webhookEventsResponse.getBody()).contains("qr.scanned");

        ResponseEntity<Map<String, Object>> webhookResponse = post(
            baseUrl + "/api/v1/integrations/webhooks",
            Map.of(
                "name", "HTTP Webhook",
                "target_url", "https://example.com/webhook",
                "subscribed_events", List.of("qr.created", "qr.scanned")
            ),
            bearer(accessToken)
        );
        assertThat(webhookResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(((Map<?, ?>) webhookResponse.getBody().get("webhook")).get("id")).isNotNull();

        ResponseEntity<String> exportResponse = restTemplate.exchange(
            baseUrl + "/api/v1/exports/audit-logs?format=json",
            HttpMethod.GET,
            new HttpEntity<>(bearer(accessToken)),
            String.class
        );
        assertThat(exportResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(exportResponse.getHeaders().getContentDisposition().getFilename()).isEqualTo("audit-logs.json");
        assertThat(exportResponse.getHeaders().getContentType()).isNotNull();
        assertThat(exportResponse.getHeaders().getContentType().isCompatibleWith(MediaType.APPLICATION_JSON)).isTrue();

        assertThat(restTemplate.getForEntity(baseUrl + "/actuator/health/readiness", String.class).getStatusCode())
            .isEqualTo(HttpStatus.OK);
        assertThat(restTemplate.getForEntity(baseUrl + "/actuator/health/liveness", String.class).getStatusCode())
            .isEqualTo(HttpStatus.OK);
    }

    private ResponseEntity<Map<String, Object>> post(String url, Object body, HttpHeaders headers) {
        HttpHeaders effectiveHeaders = headers == null ? new HttpHeaders() : new HttpHeaders(headers);
        effectiveHeaders.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, effectiveHeaders), MAP_RESPONSE);
    }

    private ResponseEntity<Map<String, Object>> getMap(String url, HttpHeaders headers) {
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), MAP_RESPONSE);
    }

    private HttpHeaders bearer(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        return headers;
    }

    private Map<String, Object> pollForAnalytics(String baseUrl, String accessToken, String qrId, int expectedTotalScans) throws InterruptedException {
        for (int attempt = 0; attempt < 10; attempt++) {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/api/v1/analytics/qr-codes/" + qrId,
                HttpMethod.GET,
                new HttpEntity<>(bearer(accessToken)),
                MAP_RESPONSE
            );
            if (response.getStatusCode() == HttpStatus.OK && Integer.valueOf(expectedTotalScans).equals(response.getBody().get("total_scans"))) {
                return response.getBody();
            }
            Thread.sleep(250);
        }
        throw new AssertionError("Timed out waiting for analytics count " + expectedTotalScans);
    }

    private Map<String, Object> defaultStyle() {
        Map<String, Object> style = new LinkedHashMap<>();
        style.put("fg_color", "#000000");
        style.put("bg_color", "#ffffff");
        style.put("size", 256);
        style.put("quiet_zone", 16);
        style.put("ec_level", "M");
        style.put("qr_style", "squares");
        style.put("eye_radius", 0);
        style.put("logo_width", 60);
        style.put("logo_height", 60);
        style.put("logo_opacity", 1.0);
        style.put("remove_qr_code_behind_logo", true);
        return style;
    }
}
