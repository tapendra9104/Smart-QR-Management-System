package com.qrmanager.platform.security;

import com.qrmanager.platform.user.Role;

import java.util.UUID;

public record AuthenticatedUser(
    UUID id,
    String email,
    Role role
) {
}
