package com.qrmanager.platform.qr;

import com.qrmanager.platform.qr.dto.BulkCreateRequest;
import com.qrmanager.platform.qr.dto.BulkCreateResult;
import com.qrmanager.platform.qr.dto.CreateQrCodeRequest;
import com.qrmanager.platform.qr.dto.QrCodeResponse;
import com.qrmanager.platform.qr.dto.UpdateQrCodeRequest;
import com.qrmanager.platform.security.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "QR Codes", description = "Create, read, update, and delete QR codes. Supports static and dynamic codes across 8 content types.")
@RestController
@RequestMapping("/api/v1/qr-codes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class QrCodeController {

    private final QrCodeService qrCodeService;
    private final CurrentUserService currentUserService;

    @Operation(
        summary = "List QR codes",
        description = "Returns a paginated list of QR codes belonging to the authenticated user. Supports full-text search by name."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of QR codes"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @GetMapping
    public ResponseEntity<Page<QrCodeResponse>> list(
        @Parameter(description = "Zero-based page index") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size (1–100)") @RequestParam(defaultValue = "12") int size,
        @Parameter(description = "Optional search filter by QR code name") @RequestParam(required = false) String search
    ) {
        UUID userId = currentUserService.require().id();
        int clampedSize = Math.max(1, Math.min(size, 100));
        return ResponseEntity.ok(qrCodeService.listForUser(userId, search, PageRequest.of(page, clampedSize)));
    }

    @Operation(
        summary = "Create a QR code",
        description = "Creates a new static or dynamic QR code. Dynamic codes use a tracked redirect; static codes encode content directly."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Created QR code"),
        @ApiResponse(responseCode = "400", description = "Validation error or invalid URL", content = @Content),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @PostMapping
    public ResponseEntity<QrCodeResponse> create(@Valid @RequestBody CreateQrCodeRequest request) {
        UUID userId = currentUserService.require().id();
        return ResponseEntity.ok(qrCodeService.createForUser(userId, request));
    }

    @Operation(summary = "Get a QR code", description = "Returns a single QR code by ID. Must belong to the authenticated user.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "QR code details"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content),
        @ApiResponse(responseCode = "404", description = "QR code not found", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<QrCodeResponse> get(
        @Parameter(description = "QR code UUID") @PathVariable UUID id
    ) {
        UUID userId = currentUserService.require().id();
        return ResponseEntity.ok(qrCodeService.getForUser(userId, id));
    }

    @Operation(
        summary = "Update a QR code",
        description = "Updates name, style, destination URL, active status, or lifecycle window (startsAt / expiresAt). Content type cannot be changed after creation."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Updated QR code"),
        @ApiResponse(responseCode = "400", description = "Validation error", content = @Content),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content),
        @ApiResponse(responseCode = "404", description = "QR code not found", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<QrCodeResponse> update(
        @Parameter(description = "QR code UUID") @PathVariable UUID id,
        @Valid @RequestBody UpdateQrCodeRequest request
    ) {
        UUID userId = currentUserService.require().id();
        return ResponseEntity.ok(qrCodeService.updateForUser(userId, id, request));
    }

    @Operation(summary = "Delete a QR code", description = "Permanently deletes a QR code and all associated scan events. This action cannot be undone.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content),
        @ApiResponse(responseCode = "404", description = "QR code not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @Parameter(description = "QR code UUID") @PathVariable UUID id
    ) {
        UUID userId = currentUserService.require().id();
        qrCodeService.deleteForUser(userId, id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
        summary = "Bulk create QR codes",
        description = "Creates multiple dynamic URL QR codes in a single request. All items must have valid HTTP/HTTPS URLs. Maximum 100 items per request."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Created QR codes"),
        @ApiResponse(responseCode = "400", description = "Validation error or invalid URL in any item", content = @Content),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @PostMapping("/bulk")
    public ResponseEntity<BulkCreateResult> bulkCreate(@Valid @RequestBody BulkCreateRequest request) {
        UUID userId = currentUserService.require().id();
        return ResponseEntity.ok(qrCodeService.bulkCreate(userId, request));
    }
}
