package com.qrmanager.platform.integration.apikey;

import com.qrmanager.platform.integration.apikey.dto.ApiKeyResponse;
import com.qrmanager.platform.integration.apikey.dto.CreateApiKeyRequest;
import com.qrmanager.platform.integration.apikey.dto.CreatedApiKeyResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "API Keys", description = "Create and manage API keys for programmatic access. Keys use the `seq_` prefix and are accepted in the `Authorization: ApiKey <key>` header.")
@RestController
@RequestMapping("/api/v1/integrations/api-keys")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final CurrentUserService currentUserService;

    @Operation(summary = "List API keys", description = "Returns all active (non-revoked) API keys for the authenticated user. The plaintext key is never returned after creation.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of API key metadata (no plaintext keys)"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @GetMapping
    public ResponseEntity<List<ApiKeyResponse>> list() {
        return ResponseEntity.ok(apiKeyService.listForUser(currentUserService.require().id()));
    }

    @Operation(
        summary = "Create an API key",
        description = "Creates a new API key. The plaintext key is returned **once** in this response — store it securely. Subsequent requests will only return metadata."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Created key with plaintext value (store this!)"),
        @ApiResponse(responseCode = "400", description = "Validation error", content = @Content),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content)
    })
    @PostMapping
    public ResponseEntity<CreatedApiKeyResponse> create(@Valid @RequestBody CreateApiKeyRequest request) {
        return ResponseEntity.ok(apiKeyService.create(currentUserService.require().id(), request));
    }

    @Operation(summary = "Revoke an API key", description = "Permanently revokes an API key. Any requests using this key will be rejected immediately.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Key revoked"),
        @ApiResponse(responseCode = "401", description = "Not authenticated", content = @Content),
        @ApiResponse(responseCode = "404", description = "Key not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revoke(
        @Parameter(description = "API key UUID") @PathVariable UUID id
    ) {
        apiKeyService.revoke(currentUserService.require().id(), id);
        return ResponseEntity.noContent().build();
    }
}
