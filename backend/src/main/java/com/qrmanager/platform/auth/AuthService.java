package com.qrmanager.platform.auth;

import com.qrmanager.platform.audit.AuditService;
import com.qrmanager.platform.auth.dto.AuthTokensResponse;
import com.qrmanager.platform.auth.dto.LoginRequest;
import com.qrmanager.platform.auth.dto.RefreshTokenRequest;
import com.qrmanager.platform.auth.dto.RegisterRequest;
import com.qrmanager.platform.notification.EmailService;
import com.qrmanager.platform.auth.dto.UserResponse;
import com.qrmanager.platform.common.BadRequestException;
import com.qrmanager.platform.common.UnauthorizedException;
import com.qrmanager.platform.config.AppProperties;
import com.qrmanager.platform.security.AuthenticatedUser;
import com.qrmanager.platform.security.CurrentUserService;
import com.qrmanager.platform.security.JwtService;
import com.qrmanager.platform.user.RefreshToken;
import com.qrmanager.platform.user.RefreshTokenRepository;
import com.qrmanager.platform.user.Role;
import com.qrmanager.platform.user.User;
import com.qrmanager.platform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final AppProperties appProperties;
    private final EmailService emailService;

    @Transactional
    public AuthTokensResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("An account with this email already exists");
        }

        User user = userRepository.save(User.builder()
            .email(email)
            .fullName(request.fullName())
            .passwordHash(passwordEncoder.encode(request.password()))
            .role(Role.USER)
            .enabled(true)
            .build());

        auditService.log(user.getId(), "USER_REGISTERED", "USER", user.getId().toString(), Map.of(
            "email", user.getEmail(),
            "role", user.getRole().name()
        ));

        return issueTokens(user);
    }

    @Transactional
    public AuthTokensResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isEnabled()) {
            throw new UnauthorizedException("Your account has been disabled. Please contact support.");
        }

        // S7: Check account lockout
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            long minutesRemaining = java.time.Duration.between(Instant.now(), user.getLockedUntil()).toMinutes() + 1;
            throw new UnauthorizedException("Account is temporarily locked. Try again in " + minutesRemaining + " minutes.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            // S7: Increment failed login attempts
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= 10) {
                user.setLockedUntil(Instant.now().plus(15, ChronoUnit.MINUTES));
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
                throw new UnauthorizedException("Too many failed attempts. Account locked for 15 minutes.");
            }
            userRepository.save(user);
            throw new UnauthorizedException("Invalid email or password");
        }

        // Reset failed attempts on successful login
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        auditService.log(user.getId(), "USER_LOGGED_IN", "USER", user.getId().toString(), Map.of(
            "email", user.getEmail()
        ));

        return issueTokens(user);
    }

    @Transactional
    public AuthTokensResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
            .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid"));

        if (!refreshToken.isActive()) {
            throw new UnauthorizedException("Refresh token has expired");
        }

        User user = refreshToken.getUser();
        return new AuthTokensResponse(jwtService.generateAccessToken(user), refreshToken.getToken(), toUserResponse(user));
    }

    public UserResponse me() {
        AuthenticatedUser user = currentUserService.require();
        return userRepository.findById(user.id())
            .map(this::toUserResponse)
            .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            return;
        }

        refreshTokenRepository.findByToken(refreshTokenValue).ifPresent(refreshToken -> {
            refreshToken.setRevokedAt(Instant.now());
            refreshTokenRepository.save(refreshToken);
            auditService.log(refreshToken.getUser().getId(), "USER_LOGGED_OUT", "USER",
                refreshToken.getUser().getId().toString(), Map.of());
        });
    }

    private AuthTokensResponse issueTokens(User user) {
        revokeActiveRefreshTokens(user.getId());

        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = UUID.randomUUID().toString();

        refreshTokenRepository.save(RefreshToken.builder()
            .token(refreshTokenValue)
            .user(user)
            .expiresAt(Instant.now().plus(appProperties.jwt().refreshTokenTtlDays(), ChronoUnit.DAYS))
            .build());

        return new AuthTokensResponse(accessToken, refreshTokenValue, toUserResponse(user));
    }

    private void revokeActiveRefreshTokens(UUID userId) {
        refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId).forEach(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }

    // ==========================================
    // Profile Update
    // ==========================================

    @Transactional
    public UserResponse updateProfile(com.qrmanager.platform.auth.dto.UpdateProfileRequest request) {
        AuthenticatedUser currentUser = currentUserService.require();
        User user = userRepository.findById(currentUser.id())
            .orElseThrow(() -> new UnauthorizedException("User not found"));

        user.setFullName(request.fullName().trim());
        userRepository.save(user);

        auditService.log(user.getId(), "PROFILE_UPDATED", "USER", user.getId().toString(), Map.of(
            "field", "full_name"
        ));

        return toUserResponse(user);
    }

    // ==========================================
    // Change Password
    // ==========================================

    @Transactional
    public void changePassword(com.qrmanager.platform.auth.dto.ChangePasswordRequest request) {
        AuthenticatedUser currentUser = currentUserService.require();
        User user = userRepository.findById(currentUser.id())
            .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Revoke all existing sessions for security
        revokeActiveRefreshTokens(user.getId());

        auditService.log(user.getId(), "PASSWORD_CHANGED", "USER", user.getId().toString(), Map.of(
            "email", user.getEmail()
        ));
    }

    // ==========================================
    // Forgot Password
    // ==========================================

    @Transactional
    public void forgotPassword(com.qrmanager.platform.auth.dto.ForgotPasswordRequest request) {
        // Always return success to prevent email enumeration
        userRepository.findByEmailIgnoreCase(request.email().trim()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build());

            String resetUrl = appProperties.frontendUrl() + "/auth/reset-password?token=" + token;

            emailService.sendPasswordResetEmail(user.getEmail(), resetUrl);

            auditService.log(user.getId(), "PASSWORD_RESET_REQUESTED", "USER", user.getId().toString(), Map.of(
                "email", user.getEmail()
            ));
        });
    }

    @Transactional
    public void resetPassword(com.qrmanager.platform.auth.dto.ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
            .orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));

        if (resetToken.isUsed()) {
            throw new BadRequestException("This reset link has already been used");
        }
        if (resetToken.isExpired()) {
            throw new BadRequestException("This reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);

        // Revoke all existing sessions
        revokeActiveRefreshTokens(user.getId());

        auditService.log(user.getId(), "PASSWORD_RESET_COMPLETED", "USER", user.getId().toString(), Map.of(
            "email", user.getEmail()
        ));
    }

    // ==========================================
    // Delete Account (GDPR)
    // ==========================================

    @Transactional
    public void deleteAccount(com.qrmanager.platform.auth.dto.DeleteAccountRequest request) {
        AuthenticatedUser currentUser = currentUserService.require();
        User user = userRepository.findById(currentUser.id())
            .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadRequestException("Incorrect password");
        }

        auditService.log(user.getId(), "ACCOUNT_DELETED", "USER", user.getId().toString(), Map.of(
            "email", user.getEmail()
        ));

        // Cascade delete: refresh tokens, reset tokens, then user
        // QR codes and related data cascade via DB foreign keys
        passwordResetTokenRepository.deleteByUserId(user.getId());
        refreshTokenRepository.findByUserIdAndRevokedAtIsNull(user.getId()).forEach(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });

        userRepository.delete(user);
    }
}
