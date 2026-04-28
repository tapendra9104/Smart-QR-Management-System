package com.qrmanager.platform.qr.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BulkCreateRequest(
    @Valid @NotEmpty List<BulkCreateItem> items
) {
}
