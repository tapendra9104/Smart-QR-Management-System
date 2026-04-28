package com.qrmanager.platform.auth;

import com.qrmanager.platform.auth.dto.AuthTokensResponse;
import com.qrmanager.platform.auth.dto.ChangePasswordRequest;
import com.qrmanager.platform.auth.dto.DeleteAccountRequest;
import com.qrmanager.platform.auth.dto.ForgotPasswordRequest;
import com.qrmanager.platform.auth.dto.LoginRequest;
import com.qrmanager.platform.auth.dto.RefreshTokenRequest;
import com.qrmanager.platform.auth.dto.RegisterRequest;
import com.qrmanager.platform.auth.dto.ResetPasswordRequest;
import com.qrmanager.platform.auth.dto.UpdateProfileRequest;
import com.qrmanager.platform.auth.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Authentication", description = "Register, login, token refresh, password management, and account lifecycle. Public endpoints do not require a token.")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new account", description = "Creates a new user account and returns JWT access + refresh tokens.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Account created, tokens returned"),
        @ApiResponse(responseCode = "400", description = "Email already exists or validation error", content = @Content)
    })
    @PostMapping("/register")
    public ResponseEntity<AuthTokensResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @Operation(
        summary = "Login",
        description = "Authenticates with email + password. Accounts are locked for 15 minutes after 10 consecutive failures."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Authenticated, tokens returned"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials or account locked", content = @Content)
    })
    @PostMapping("/login")
    public ResponseEntity<AuthTokensResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Refresh access token", description = "Exchanges a valid refresh token for a new access token. Refresh tokens do not rotate on each use.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "New access token issued"),
        @ApiResponse(responseCode = "401", description = "Refresh token invalid or expired", content = @Content)
    })
    @PostMapping("/refresh")
    public ResponseEntity<AuthTokensResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @Operation(summary = "Logout", description = "Revokes the provided refresh token. Pass the refresh token in the X-Refresh-Token header.")
    @ApiResponse(responseCode = "204", description = "Logged out")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
        @Parameter(description = "Refresh token to revoke") @RequestHeader(value = "X-Refresh-Token", required = false) String refreshToken
    ) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get current user", description = "Returns the profile of the authenticated user.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Current user profile"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(authService.me());
    }

    @Operation(summary = "Update profile", description = "Updates the full name of the authenticated user.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Updated user profile"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(request));
    }

    @Operation(summary = "Change password", description = "Changes the password for the authenticated user. All existing sessions are revoked on success.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Password changed"),
        @ApiResponse(responseCode = "400", description = "Current password incorrect or new password same as current", content = @Content),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @Operation(
        summary = "Forgot password",
        description = "Sends a password reset link to the provided email. Always returns success to prevent email enumeration — no error is returned for unknown emails."
    )
    @ApiResponse(responseCode = "200", description = "Reset email sent (or silently ignored if email unknown)")
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "If an account with that email exists, a reset link has been sent."));
    }

    @Operation(summary = "Reset password", description = "Resets the password using a valid one-time token from the reset email. All sessions are revoked on success.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Password reset successfully"),
        @ApiResponse(responseCode = "400", description = "Token invalid, expired, or already used", content = @Content)
    })
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully. Please sign in with your new password."));
    }

    @Operation(
        summary = "Delete account (GDPR)",
        description = "Permanently deletes the authenticated user's account and all associated data including QR codes, scan events, and audit logs. Requires password confirmation."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Account deleted"),
        @ApiResponse(responseCode = "400", description = "Incorrect password", content = @Content),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(@Valid @RequestBody DeleteAccountRequest request) {
        authService.deleteAccount(request);
        return ResponseEntity.noContent().build();
    }
}
