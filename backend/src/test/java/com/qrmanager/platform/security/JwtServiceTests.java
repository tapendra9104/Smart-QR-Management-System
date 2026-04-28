package com.qrmanager.platform.security;

import com.qrmanager.platform.config.AppProperties;
import com.qrmanager.platform.user.Role;
import com.qrmanager.platform.user.User;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Pure unit tests for JwtService — no Spring context loaded, runs in milliseconds.
 * Uses a hard-coded 256-bit Base64 secret so tests are deterministic and fast.
 */
class JwtServiceTests {

    // 256-bit secret for testing only — never use in production
    private static final String TEST_SECRET =
        Base64.getEncoder().encodeToString(
            "this-is-a-test-secret-at-least-32-bytes".getBytes()
        );

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        AppProperties.Jwt jwtProps = mock(AppProperties.Jwt.class);
        when(jwtProps.secret()).thenReturn(TEST_SECRET);
        when(jwtProps.accessTokenTtlMinutes()).thenReturn(60L);

        AppProperties appProperties = mock(AppProperties.class);
        when(appProperties.jwt()).thenReturn(jwtProps);

        jwtService = new JwtService(appProperties);
    }

    private User buildUser(UUID id, String email, Role role) {
        return User.builder()
            .id(id)
            .email(email)
            .fullName("Test User")
            .passwordHash("hashed")
            .role(role)
            .enabled(true)
            .build();
    }

    // ─── generateAccessToken ──────────────────────────────────────────────────

    @Test
    @DisplayName("Generated token is non-blank")
    void generatesNonBlankToken() {
        User user = buildUser(UUID.randomUUID(), "user@example.com", Role.USER);
        String token = jwtService.generateAccessToken(user);
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("Generated token is a valid three-part JWT")
    void generatesValidJwtStructure() {
        User user = buildUser(UUID.randomUUID(), "user@example.com", Role.USER);
        String token = jwtService.generateAccessToken(user);
        assertThat(token.split("\\.")).hasSize(3);
    }

    // ─── parse / toAuthenticatedUser ─────────────────────────────────────────

    @Test
    @DisplayName("Parses subject (user ID) from token correctly")
    void parsesSubjectFromToken() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "alice@example.com", Role.USER);
        String token = jwtService.generateAccessToken(user);

        AuthenticatedUser parsed = jwtService.toAuthenticatedUser(token);
        assertThat(parsed.id()).isEqualTo(userId);
    }

    @Test
    @DisplayName("Parses email claim from token correctly")
    void parsesEmailFromToken() {
        User user = buildUser(UUID.randomUUID(), "bob@example.com", Role.USER);
        String token = jwtService.generateAccessToken(user);

        AuthenticatedUser parsed = jwtService.toAuthenticatedUser(token);
        assertThat(parsed.email()).isEqualTo("bob@example.com");
    }

    @Test
    @DisplayName("Parses role claim from token correctly for USER role")
    void parsesUserRoleFromToken() {
        User user = buildUser(UUID.randomUUID(), "user@example.com", Role.USER);
        String token = jwtService.generateAccessToken(user);

        AuthenticatedUser parsed = jwtService.toAuthenticatedUser(token);
        assertThat(parsed.role()).isEqualTo(Role.USER);
    }

    @Test
    @DisplayName("Parses role claim from token correctly for ADMIN role")
    void parsesAdminRoleFromToken() {
        User admin = buildUser(UUID.randomUUID(), "admin@example.com", Role.ADMIN);
        String token = jwtService.generateAccessToken(admin);

        AuthenticatedUser parsed = jwtService.toAuthenticatedUser(token);
        assertThat(parsed.role()).isEqualTo(Role.ADMIN);
    }

    @Test
    @DisplayName("Two tokens for the same user are not identical (unique jti / iat)")
    void twoTokensForSameUserDiffer() throws InterruptedException {
        User user = buildUser(UUID.randomUUID(), "user@example.com", Role.USER);
        String token1 = jwtService.generateAccessToken(user);
        Thread.sleep(1); // ensure iat timestamp differs by at least 1 ms
        String token2 = jwtService.generateAccessToken(user);
        // Tokens may differ only in the iat claim — comparing full strings is sufficient
        // This guards against accidentally returning a cached/constant token
        assertThat(token1).isNotEqualTo(token2);
    }

    // ─── Rejection scenarios ──────────────────────────────────────────────────

    @Test
    @DisplayName("Rejects a token signed with a different secret")
    void rejectsTokenWithWrongSecret() {
        // Build a separate JwtService with a different secret
        String otherSecret = Base64.getEncoder().encodeToString(
            "different-secret-key-at-least-32-b".getBytes()
        );
        AppProperties.Jwt otherJwtProps = mock(AppProperties.Jwt.class);
        when(otherJwtProps.secret()).thenReturn(otherSecret);
        when(otherJwtProps.accessTokenTtlMinutes()).thenReturn(60L);
        AppProperties otherProps = mock(AppProperties.class);
        when(otherProps.jwt()).thenReturn(otherJwtProps);
        JwtService otherService = new JwtService(otherProps);

        User user = buildUser(UUID.randomUUID(), "user@example.com", Role.USER);
        String tokenFromOther = otherService.generateAccessToken(user);

        // Our jwtService should reject the token from the other service
        assertThatThrownBy(() -> jwtService.parse(tokenFromOther))
            .isInstanceOf(SignatureException.class);
    }

    @Test
    @DisplayName("Rejects a clearly malformed / garbage token string")
    void rejectsMalformedToken() {
        assertThatThrownBy(() -> jwtService.parse("not.a.valid.jwt.token"))
            .isInstanceOf(MalformedJwtException.class);
    }

    @Test
    @DisplayName("Rejects an empty string as token")
    void rejectsEmptyToken() {
        assertThatThrownBy(() -> jwtService.parse(""))
            .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("Generates an immediately-expired token and rejects it on parse")
    void rejectsExpiredToken() {
        // Build a JwtService where TTL is 0 minutes (instant expiry)
        AppProperties.Jwt shortTtl = mock(AppProperties.Jwt.class);
        when(shortTtl.secret()).thenReturn(TEST_SECRET);
        when(shortTtl.accessTokenTtlMinutes()).thenReturn(0L);
        AppProperties shortProps = mock(AppProperties.class);
        when(shortProps.jwt()).thenReturn(shortTtl);
        JwtService shortService = new JwtService(shortProps);

        User user = buildUser(UUID.randomUUID(), "user@example.com", Role.USER);
        String expiredToken = shortService.generateAccessToken(user);

        assertThatThrownBy(() -> jwtService.parse(expiredToken))
            .isInstanceOf(ExpiredJwtException.class);
    }
}
