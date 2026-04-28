package com.qrmanager.platform.auth.dto;

import com.qrmanager.platform.user.Role;

import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String fullName,
    Role role
) {
}
