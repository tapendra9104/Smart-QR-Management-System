package com.qrmanager.platform.integration.apikey;

import com.qrmanager.platform.audit.AuditLogRepository;
import com.qrmanager.platform.integration.apikey.dto.CreateApiKeyRequest;
import com.qrmanager.platform.integration.apikey.dto.CreatedApiKeyResponse;
import com.qrmanager.platform.qr.QrCodeRepository;
import com.qrmanager.platform.user.RefreshTokenRepository;
import com.qrmanager.platform.user.Role;
import com.qrmanager.platform.user.User;
import com.qrmanager.platform.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ApiKeyServiceTests {

    @Autowired
    private ApiKeyService apiKeyService;

    @Autowired
    private ApiKeyRepository apiKeyRepository;

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
        qrCodeRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        auditLogRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void createsAuthenticatesAndRevokesApiKeys() {
        User user = userRepository.save(User.builder()
            .email("api-key-" + UUID.randomUUID() + "@example.com")
            .fullName("API Key User")
            .passwordHash("hashed-password")
            .role(Role.ADMIN)
            .enabled(true)
            .build());

        CreatedApiKeyResponse created = apiKeyService.create(user.getId(), new CreateApiKeyRequest("CI Key", null));
        ApiKey authenticated = apiKeyService.authenticate(created.plaintextKey());

        assertThat(created.plaintextKey()).startsWith("seq_");
        assertThat(authenticated.getUser().getId()).isEqualTo(user.getId());

        apiKeyService.revoke(user.getId(), created.apiKey().id());

        assertThat(apiKeyRepository.findById(created.apiKey().id()))
            .get()
            .extracting(ApiKey::getRevokedAt)
            .isNotNull();
    }
}
