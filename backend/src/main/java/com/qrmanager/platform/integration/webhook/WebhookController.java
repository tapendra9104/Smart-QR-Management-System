package com.qrmanager.platform.integration.webhook;

import com.qrmanager.platform.integration.webhook.dto.CreateWebhookRequest;
import com.qrmanager.platform.integration.webhook.dto.CreatedWebhookResponse;
import com.qrmanager.platform.integration.webhook.dto.UpdateWebhookRequest;
import com.qrmanager.platform.integration.webhook.dto.WebhookResponse;
import com.qrmanager.platform.security.CurrentUserService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Webhooks", description = "Register HTTP endpoints to receive real-time event notifications when QR codes are created, updated, deleted, or scanned.")
@RestController
@RequestMapping("/api/v1/integrations/webhooks")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class WebhookController {

    private final WebhookService webhookService;
    private final CurrentUserService currentUserService;

    @Operation(summary = "List webhooks", description = "Returns all registered webhook endpoints for the authenticated user.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of webhooks"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @GetMapping
    public ResponseEntity<List<WebhookResponse>> list() {
        return ResponseEntity.ok(webhookService.listForUser(currentUserService.require().id()));
    }

    @Operation(
        summary = "List supported event types",
        description = "Returns all event type names that can be subscribed to. Use these values in `subscribed_events` when creating or updating a webhook."
    )
    @ApiResponse(responseCode = "200", description = "Supported event type names (e.g. `qr.created`, `qr.scanned`)")
    @GetMapping("/events")
    public ResponseEntity<List<String>> supportedEvents() {
        return ResponseEntity.ok(WebhookEventType.supportedValues());
    }

    @Operation(
        summary = "Create a webhook",
        description = "Registers a new webhook endpoint. The system will send an HMAC-SHA256-signed POST request to the target URL for each subscribed event."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Created webhook (includes signing secret)"),
        @ApiResponse(responseCode = "400", description = "Validation error or invalid event type", content = @Content),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @PostMapping
    public ResponseEntity<CreatedWebhookResponse> create(@Valid @RequestBody CreateWebhookRequest request) {
        return ResponseEntity.ok(webhookService.create(currentUserService.require().id(), request));
    }

    @Operation(summary = "Update a webhook", description = "Updates the target URL, name, or subscribed event types for an existing webhook.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Updated webhook"),
        @ApiResponse(responseCode = "400", description = "Validation error", content = @Content),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content),
        @ApiResponse(responseCode = "404", description = "Webhook not found", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<WebhookResponse> update(
        @Parameter(description = "Webhook UUID") @PathVariable UUID id,
        @Valid @RequestBody UpdateWebhookRequest request
    ) {
        return ResponseEntity.ok(webhookService.update(currentUserService.require().id(), id, request));
    }

    @Operation(summary = "Delete a webhook", description = "Permanently removes a webhook endpoint. No further events will be delivered to it.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content),
        @ApiResponse(responseCode = "404", description = "Webhook not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @Parameter(description = "Webhook UUID") @PathVariable UUID id
    ) {
        webhookService.delete(currentUserService.require().id(), id);
        return ResponseEntity.noContent().build();
    }
}
