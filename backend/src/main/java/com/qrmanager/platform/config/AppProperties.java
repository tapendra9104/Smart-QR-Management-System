package com.qrmanager.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
    String frontendUrl,
    Jwt jwt,
    Redirect redirect,
    RateLimit rateLimit,
    Retention retention,
    Messaging messaging,
    Analytics analytics
) {
    public String redirectSigningSecret() {
        if (redirect != null && redirect.signingSecret() != null && !redirect.signingSecret().isBlank()) {
            return redirect.signingSecret();
        }
        return jwt != null ? jwt.secret() : "";
    }

    public boolean requireSignedRedirects() {
        return redirect == null || redirect.requireSignature();
    }

    public boolean rateLimitingEnabled() {
        return rateLimit == null || rateLimit.enabled();
    }

    public int authRequestsPerMinute() {
        return rateLimit != null && rateLimit.authRequestsPerMinute() > 0
            ? rateLimit.authRequestsPerMinute()
            : 20;
    }

    public int publicResolveRequestsPerMinute() {
        return rateLimit != null && rateLimit.publicResolveRequestsPerMinute() > 0
            ? rateLimit.publicResolveRequestsPerMinute()
            : 240;
    }

    public int scanEventRetentionDays() {
        return retention != null && retention.scanEventsDays() > 0
            ? retention.scanEventsDays()
            : 365;
    }

    public int auditLogRetentionDays() {
        return retention != null && retention.auditLogsDays() > 0
            ? retention.auditLogsDays()
            : 730;
    }

    public int refreshTokenRetentionDays() {
        return retention != null && retention.refreshTokensDays() > 0
            ? retention.refreshTokensDays()
            : 30;
    }

    public boolean messagingEnabled() {
        return messaging != null && messaging.enabled();
    }

    public boolean olapEnabled() {
        return analytics != null && analytics.olapEnabled();
    }

    public String clickHouseJdbcUrl() {
        return analytics != null && analytics.clickHouse() != null && analytics.clickHouse().jdbcUrl() != null
            ? analytics.clickHouse().jdbcUrl()
            : "jdbc:clickhouse://localhost:8123/default";
    }

    public String clickHouseUsername() {
        return analytics != null && analytics.clickHouse() != null && analytics.clickHouse().username() != null
            ? analytics.clickHouse().username()
            : "default";
    }

    public String clickHousePassword() {
        return analytics != null && analytics.clickHouse() != null && analytics.clickHouse().password() != null
            ? analytics.clickHouse().password()
            : "";
    }

    public record Jwt(
        String secret,
        long accessTokenTtlMinutes,
        long refreshTokenTtlDays
    ) {
    }

    public record Redirect(
        String signingSecret,
        boolean requireSignature
    ) {
    }

    public record RateLimit(
        boolean enabled,
        int authRequestsPerMinute,
        int publicResolveRequestsPerMinute
    ) {
    }

    public record Retention(
        int scanEventsDays,
        int auditLogsDays,
        int refreshTokensDays
    ) {
    }

    public record Messaging(
        boolean enabled
    ) {
    }

    public record Analytics(
        boolean olapEnabled,
        ClickHouse clickHouse
    ) {
    }

    public record ClickHouse(
        String jdbcUrl,
        String username,
        String password
    ) {
    }
}
