package com.qrmanager.platform.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger UI configuration.
 *
 * <p>Once the application is running, visit:
 * <ul>
 *   <li>Swagger UI: <a href="http://localhost:8080/swagger-ui.html">http://localhost:8080/swagger-ui.html</a></li>
 *   <li>Raw JSON spec: <a href="http://localhost:8080/v3/api-docs">http://localhost:8080/v3/api-docs</a></li>
 * </ul>
 *
 * <p>To authenticate in the UI, click the "Authorize" button and enter:
 * <pre>Bearer &lt;your-access-token&gt;</pre>
 */
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "QR Manager Platform API",
        version = "v1",
        description = """
            REST API for the QR Manager platform.

            **Features covered:**
            - Authentication (JWT + refresh tokens + API keys)
            - QR code CRUD and bulk creation
            - Dynamic QR redirect with signed URLs
            - Scan analytics (real-time + OLAP via ClickHouse)
            - Webhook integrations
            - Audit log exports
            - Usage limits and data retention

            **Authentication:**
            Most endpoints require a Bearer JWT in the `Authorization` header.
            Obtain a token via `POST /api/v1/auth/login` or `POST /api/v1/auth/register`.
            API keys (`Authorization: ApiKey seq_...`) are also accepted on all protected routes.
            """,
        contact = @Contact(
            name = "QR Manager Support",
            email = "support@qrmanager.app"
        ),
        license = @License(
            name = "Proprietary",
            url = "https://qrmanager.app/terms"
        )
    ),
    servers = {
        @Server(url = "http://localhost:8080", description = "Local development"),
        @Server(url = "http://localhost:8081", description = "Via API Gateway (local)"),
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "JWT access token obtained from /api/v1/auth/login or /api/v1/auth/register"
)
@SecurityScheme(
    name = "apiKeyAuth",
    type = SecuritySchemeType.APIKEY,
    description = "API key prefixed with 'ApiKey ' (e.g. ApiKey seq_abc123...)",
    // OpenAPI 3.0 does not natively model custom header prefixes;
    // the security scheme is documented here for clarity.
    // Use the Authorization header with value: ApiKey <your-key>
    paramName = "Authorization",
    in = io.swagger.v3.oas.annotations.enums.SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
    // All configuration is annotation-driven; no bean definitions needed.
}
