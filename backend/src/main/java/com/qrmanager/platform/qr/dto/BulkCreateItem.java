package com.qrmanager.platform.qr.dto;

import jakarta.validation.constraints.NotBlank;

public record BulkCreateItem(
    @NotBlank String name,
    @NotBlank String content
) {
}
