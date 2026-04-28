package com.qrmanager.platform.auth;

import com.qrmanager.platform.audit.AuditService;
import com.qrmanager.platform.auth.dto.*;
import com.qrmanager.platform.common.BadRequestException;
import com.qrmanager.platform.common.UnauthorizedException;
import com.qrmanager.platform.config.AppProperties;
import com.qrmanager.platform.notification.EmailService;
import com.qrmanager.platform.security.AuthenticatedUser;
import com.qrmanager.platform.security.CurrentUserService;
import com.qrmanager.platform.security.JwtService;
import com.qrmanager.platform.user.RefreshToken;
import com.qrmanager.platform.user.RefreshTokenRepository;
import com.qrmanager.platform.user.Role;
import com.qrmanager.platform.user.User;
import com.qrmanager.platform.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService — all dependencies are mocked via Mockito.
 * No database, no Spring context: these run in milliseconds.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock CurrentUserService currentUserService;
    @Mock AuditService auditService;
    @Mock AppProperties appProperties;
    @Mock EmailService emailService;

    @InjectMocks
    AuthService authService;

    // Helpers ─────────────────────────────────────────────────────────────────

    private User activeUser(UUID id, String email, String passwordHash) {
        return User.builder()
            .id(id)
            .email(email)
            .fullName("Test User")
            .passwordHash(passwordHash)
            .role(Role.USER)
            .enabled(true)
            .failedLoginAttempts(0)
            .build();
    }

    private void stubJwtIssue() {
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("mock-access-token");
        when(refreshTokenRepository.findByUserIdAndRevokedAtIsNull(any())).thenReturn(Collections.emptyList());
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        AppProperties.Jwt jwt = mock(AppProperties.Jwt.class);
        when(jwt.refreshTokenTtlDays()).thenReturn(7L);
        when(appProperties.jwt()).thenReturn(jwt);
    }

    // ─── register ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("register()")
    class Register {

        @Test
        @DisplayName("Happy path: saves user and returns tokens")
        void happyPath() {
            UUID userId = UUID.randomUUID();
            RegisterRequest req = new RegisterRequest("new@example.com", "Password1!", "New User");

            when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
            when(passwordEncoder.encode("Password1!")).thenReturn("hashed-pw");
            User savedUser = activeUser(userId, "new@example.com", "hashed-pw");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            stubJwtIssue();

            AuthTokensResponse response = authService.register(req);

            assertThat(response.accessToken()).isEqualTo("mock-access-token");
            assertThat(response.user().email()).isEqualTo("new@example.com");
            verify(userRepository).existsByEmailIgnoreCase("new@example.com");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Throws BadRequestException when email already exists")
        void duplicateEmail() {
            RegisterRequest req = new RegisterRequest("exists@example.com", "Password1!", "Existing");
            when(userRepository.existsByEmailIgnoreCase("exists@example.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already exists");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Email is normalised to lowercase before saving")
        void normalisesEmail() {
            RegisterRequest req = new RegisterRequest("MiXeD@Example.COM", "Password1!", "User");
            when(userRepository.existsByEmailIgnoreCase("mixed@example.com")).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("hashed");

            UUID userId = UUID.randomUUID();
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            User savedUser = activeUser(userId, "mixed@example.com", "hashed");
            when(userRepository.save(userCaptor.capture())).thenReturn(savedUser);
            stubJwtIssue();

            authService.register(req);

            assertThat(userCaptor.getValue().getEmail()).isEqualTo("mixed@example.com");
        }
    }

    // ─── login ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("Happy path: returns tokens on valid credentials")
        void happyPath() {
            UUID userId = UUID.randomUUID();
            User user = activeUser(userId, "user@example.com", "hashed-pw");
            when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("correct-password", "hashed-pw")).thenReturn(true);
            when(userRepository.save(any(User.class))).thenReturn(user);
            stubJwtIssue();

            AuthTokensResponse response = authService.login(new LoginRequest("user@example.com", "correct-password"));

            assertThat(response.accessToken()).isEqualTo("mock-access-token");
        }

        @Test
        @DisplayName("Throws UnauthorizedException for unknown email")
        void unknownEmail() {
            when(userRepository.findByEmailIgnoreCase("unknown@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(new LoginRequest("unknown@example.com", "any")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid email or password");
        }

        @Test
        @DisplayName("Throws UnauthorizedException for wrong password")
        void wrongPassword() {
            User user = activeUser(UUID.randomUUID(), "user@example.com", "hashed-pw");
            when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong-password", "hashed-pw")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(user);

            assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "wrong-password")))
                .isInstanceOf(UnauthorizedException.class);

            assertThat(user.getFailedLoginAttempts()).isEqualTo(1);
        }

        @Test
        @DisplayName("Throws UnauthorizedException for disabled account")
        void disabledAccount() {
            User user = User.builder()
                .id(UUID.randomUUID())
                .email("disabled@example.com")
                .passwordHash("hashed")
                .role(Role.USER)
                .enabled(false)
                .failedLoginAttempts(0)
                .build();
            when(userRepository.findByEmailIgnoreCase("disabled@example.com")).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.login(new LoginRequest("disabled@example.com", "any")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("disabled");
        }

        @Test
        @DisplayName("Locks account after 10 failed attempts")
        void locksAfterTenFailedAttempts() {
            User user = activeUser(UUID.randomUUID(), "user@example.com", "hashed-pw");
            user.setFailedLoginAttempts(9); // 9 existing failures; this attempt is the 10th
            when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "hashed-pw")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(user);

            assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "wrong")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("locked");

            assertThat(user.getLockedUntil()).isNotNull();
        }

        @Test
        @DisplayName("Throws UnauthorizedException when account is temporarily locked")
        void rejectsLockedAccount() {
            User user = activeUser(UUID.randomUUID(), "locked@example.com", "hashed-pw");
            user.setLockedUntil(Instant.now().plus(10, ChronoUnit.MINUTES));
            when(userRepository.findByEmailIgnoreCase("locked@example.com")).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.login(new LoginRequest("locked@example.com", "any")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("locked");
        }

        @Test
        @DisplayName("Resets failed attempts on successful login")
        void resetsFailedAttemptsOnSuccess() {
            User user = activeUser(UUID.randomUUID(), "user@example.com", "hashed-pw");
            user.setFailedLoginAttempts(3);
            when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("correct-password", "hashed-pw")).thenReturn(true);
            when(userRepository.save(any(User.class))).thenReturn(user);
            stubJwtIssue();

            authService.login(new LoginRequest("user@example.com", "correct-password"));

            assertThat(user.getFailedLoginAttempts()).isEqualTo(0);
            assertThat(user.getLockedUntil()).isNull();
        }
    }

    // ─── forgotPassword ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("forgotPassword()")
    class ForgotPassword {

        @Test
        @DisplayName("Sends reset email when user exists")
        void sendsEmailWhenUserExists() {
            User user = activeUser(UUID.randomUUID(), "user@example.com", "hashed");
            when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
            when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));
            when(appProperties.frontendUrl()).thenReturn("https://app.example.com");

            authService.forgotPassword(new ForgotPasswordRequest("user@example.com"));

            verify(emailService).sendPasswordResetEmail(eq("user@example.com"), anyString());
            verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        }

        @Test
        @DisplayName("Does NOT throw or send email when email is unknown (prevents enumeration)")
        void silentlyIgnoresUnknownEmail() {
            when(userRepository.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());

            // Must not throw
            authService.forgotPassword(new ForgotPasswordRequest("ghost@example.com"));

            verify(emailService, never()).sendPasswordResetEmail(any(), any());
            verify(passwordResetTokenRepository, never()).save(any());
        }
    }

    // ─── changePassword ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("changePassword()")
    class ChangePassword {

        @Test
        @DisplayName("Throws BadRequestException if current password is wrong")
        void wrongCurrentPassword() {
            UUID userId = UUID.randomUUID();
            User user = activeUser(userId, "user@example.com", "old-hash");
            when(currentUserService.require()).thenReturn(new AuthenticatedUser(userId, "user@example.com", Role.USER));
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

            assertThatThrownBy(() -> authService.changePassword(
                new ChangePasswordRequest("wrong", "NewPassword1!")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("incorrect");
        }

        @Test
        @DisplayName("Throws BadRequestException if new password equals current password")
        void samePassword() {
            UUID userId = UUID.randomUUID();
            User user = activeUser(userId, "user@example.com", "current-hash");
            when(currentUserService.require()).thenReturn(new AuthenticatedUser(userId, "user@example.com", Role.USER));
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("CurrentPass1!", "current-hash")).thenReturn(true);
            when(passwordEncoder.matches("CurrentPass1!", "current-hash")).thenReturn(true);

            assertThatThrownBy(() -> authService.changePassword(
                new ChangePasswordRequest("CurrentPass1!", "CurrentPass1!")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("different");
        }
    }

    // ─── logout ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("logout()")
    class Logout {

        @Test
        @DisplayName("Revokes a valid refresh token on logout")
        void revokesToken() {
            UUID userId = UUID.randomUUID();
            User user = activeUser(userId, "user@example.com", "hashed");
            RefreshToken token = RefreshToken.builder()
                .token("valid-refresh-token")
                .user(user)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
            when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(token));
            when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(token);

            authService.logout("valid-refresh-token");

            assertThat(token.getRevokedAt()).isNotNull();
            verify(refreshTokenRepository).save(token);
        }

        @Test
        @DisplayName("Does nothing for null or blank refresh token")
        void ignoresBlankToken() {
            authService.logout(null);
            authService.logout("   ");
            verify(refreshTokenRepository, never()).findByToken(any());
        }
    }
}
