package com.qrmanager.platform.analytics;

import com.qrmanager.platform.analytics.dto.AnalyticsOverviewResponse;
import com.qrmanager.platform.analytics.dto.QrAnalyticsResponse;
import com.qrmanager.platform.security.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Analytics", description = "Scan analytics per QR code and account-level overview. Data is sourced from ClickHouse when OLAP is enabled, otherwise PostgreSQL.")
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final CurrentUserService currentUserService;

    @Operation(
        summary = "Account analytics overview",
        description = "Returns aggregated scan counts, top-performing QR codes, device breakdown, and time-series data for the authenticated user's entire account."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Analytics overview"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewResponse> overview() {
        UUID userId = currentUserService.require().id();
        return ResponseEntity.ok(analyticsService.getOverview(userId));
    }

    @Operation(
        summary = "QR code analytics",
        description = "Returns detailed scan analytics for a specific QR code: total scans, unique devices, scan timeline, top countries, and referrer breakdown."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "QR code analytics"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content),
        @ApiResponse(responseCode = "404", description = "QR code not found or not owned by user", content = @Content)
    })
    @GetMapping("/qr-codes/{id}")
    public ResponseEntity<QrAnalyticsResponse> qrCodeAnalytics(
        @Parameter(description = "QR code UUID") @PathVariable UUID id
    ) {
        UUID userId = currentUserService.require().id();
        return ResponseEntity.ok(analyticsService.getQrAnalytics(userId, id));
    }
}
