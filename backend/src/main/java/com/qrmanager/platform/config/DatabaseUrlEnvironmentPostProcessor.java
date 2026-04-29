package com.qrmanager.platform.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "databaseUrlNormalizer";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String rawUrl = firstText(
            environment.getProperty("SPRING_DATASOURCE_URL"),
            environment.getProperty("DATABASE_URL")
        );
        if (!StringUtils.hasText(rawUrl)) {
            return;
        }

        NormalizedDatabaseUrl normalized = normalize(rawUrl);
        if (normalized == null) {
            return;
        }

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("spring.datasource.url", normalized.jdbcUrl());

        if (!StringUtils.hasText(environment.getProperty("SPRING_DATASOURCE_USERNAME"))
            && StringUtils.hasText(normalized.username())) {
            properties.put("spring.datasource.username", normalized.username());
        }
        if (!StringUtils.hasText(environment.getProperty("SPRING_DATASOURCE_PASSWORD"))
            && StringUtils.hasText(normalized.password())) {
            properties.put("spring.datasource.password", normalized.password());
        }

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
    }

    static NormalizedDatabaseUrl normalize(String rawUrl) {
        String trimmed = rawUrl.trim();
        if (trimmed.startsWith("jdbc:postgresql://")) {
            return new NormalizedDatabaseUrl(ensureNeonSslMode(trimmed), null, null);
        }
        if (!trimmed.startsWith("postgresql://") && !trimmed.startsWith("postgres://")) {
            return null;
        }

        URI uri = URI.create(trimmed.replaceFirst("^postgres://", "postgresql://"));
        String host = uri.getHost();
        if (!StringUtils.hasText(host)) {
            return null;
        }

        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://").append(host);
        if (uri.getPort() > -1) {
            jdbcUrl.append(':').append(uri.getPort());
        }
        jdbcUrl.append(StringUtils.hasText(uri.getRawPath()) ? uri.getRawPath() : "/postgres");
        if (StringUtils.hasText(uri.getRawQuery())) {
            jdbcUrl.append('?').append(uri.getRawQuery());
        }

        String username = null;
        String password = null;
        String userInfo = uri.getUserInfo();
        if (StringUtils.hasText(userInfo)) {
            int separator = userInfo.indexOf(':');
            if (separator >= 0) {
                username = userInfo.substring(0, separator);
                password = userInfo.substring(separator + 1);
            } else {
                username = userInfo;
            }
        }

        return new NormalizedDatabaseUrl(ensureNeonSslMode(jdbcUrl.toString()), username, password);
    }

    private static String ensureNeonSslMode(String jdbcUrl) {
        if (!jdbcUrl.contains(".neon.tech") || jdbcUrl.contains("sslmode=")) {
            return jdbcUrl;
        }
        return jdbcUrl + (jdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
    }

    private static String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    record NormalizedDatabaseUrl(String jdbcUrl, String username, String password) {
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }
}
