package com.qrmanager.platform.export;

import com.qrmanager.platform.security.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Tag(name = "Exports", description = "Export scan analytics and audit logs as CSV or JSON files. Files are returned as downloadable attachments.")
@RestController
@RequestMapping("/api/v1/exports")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class ExportController {

    private final ExportService exportService;
    private final CurrentUserService currentUserService;

    @Operation(
        summary = "Export scan analytics",
        description = "Downloads scan event data for all QR codes owned by the authenticated user. Use `format=csv` for spreadsheet compatibility or `format=json` for programmatic processing."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "File download (Content-Disposition: attachment)"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @GetMapping("/analytics")
    public ResponseEntity<String> analytics(
        @Parameter(description = "Output format: `csv` (default) or `json`") @RequestParam(defaultValue = "csv") String format
    ) {
        UUID userId = currentUserService.require().id();
        return buildDownload(
            "analytics." + extension(format),
            "json".equalsIgnoreCase(format) ? exportService.exportScanEventsJson(userId) : exportService.exportScanEventsCsv(userId),
            "json".equalsIgnoreCase(format) ? MediaType.APPLICATION_JSON : new MediaType("text", "csv", StandardCharsets.UTF_8)
        );
    }

    @Operation(
        summary = "Export audit logs",
        description = "Downloads the complete audit trail for the authenticated user — all create, update, delete, login, and password change events."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "File download (Content-Disposition: attachment)"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @GetMapping("/audit-logs")
    public ResponseEntity<String> auditLogs(
        @Parameter(description = "Output format: `csv` (default) or `json`") @RequestParam(defaultValue = "csv") String format
    ) {
        UUID userId = currentUserService.require().id();
        return buildDownload(
            "audit-logs." + extension(format),
            "json".equalsIgnoreCase(format) ? exportService.exportAuditLogsJson(userId) : exportService.exportAuditLogsCsv(userId),
            "json".equalsIgnoreCase(format) ? MediaType.APPLICATION_JSON : new MediaType("text", "csv", StandardCharsets.UTF_8)
        );
    }

    private ResponseEntity<String> buildDownload(String filename, String body, MediaType contentType) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(contentType)
            .body(body);
    }

    private String extension(String format) {
        return "json".equalsIgnoreCase(format) ? "json" : "csv";
    }
}
