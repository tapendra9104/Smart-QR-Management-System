package com.qrmanager.platform.qr.dto;

import java.util.List;

public record BulkCreateResult(
    List<QrCodeResponse> items
) {
}
