package com.qrmanager.gateway;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GatewayRoutesConfigTests {

    @Test
    void keepsLocalBackendUrl() {
        assertThat(GatewayRoutesConfig.resolveBackendUrl("http://localhost:8080"))
            .isEqualTo("http://localhost:8080");
    }

    @Test
    void replacesSelfReferentialRenderGatewayUrl() {
        assertThat(GatewayRoutesConfig.resolveBackendUrl("https://qr-manager-gateway.onrender.com"))
            .isEqualTo(GatewayRoutesConfig.RENDER_BACKEND_URL);
    }

    @Test
    void replacesBlankUrlWithRenderBackendUrl() {
        assertThat(GatewayRoutesConfig.resolveBackendUrl(" "))
            .isEqualTo(GatewayRoutesConfig.RENDER_BACKEND_URL);
    }
}
