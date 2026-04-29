package com.qrmanager.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class GatewayRoutesConfig {

    static final String RENDER_BACKEND_URL = "https://qr-manager-backend-dadr.onrender.com";
    private static final String RENDER_GATEWAY_HOST = "qr-manager-gateway.onrender.com";

    @Bean
    RouteLocator backendRoutes(RouteLocatorBuilder builder, @Value("${GATEWAY_BACKEND_URL:http://localhost:8080}") String backendUrl) {
        return builder.routes()
            .route("backend-api", route -> route
                .path("/api/v1/**")
                .uri(resolveBackendUrl(backendUrl)))
            .build();
    }

    static String resolveBackendUrl(String backendUrl) {
        if (!StringUtils.hasText(backendUrl)) {
            return RENDER_BACKEND_URL;
        }

        String trimmed = backendUrl.trim();
        if (trimmed.contains(RENDER_GATEWAY_HOST)) {
            return RENDER_BACKEND_URL;
        }

        return trimmed;
    }
}
