package com.qrmanager.platform.security;

import com.qrmanager.platform.common.RateLimitExceededException;
import com.qrmanager.platform.config.AppProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Set<String> AUTH_ENDPOINTS = Set.of(
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh"
    );

    private static final Pattern PUBLIC_RESOLVE_PATTERN = Pattern.compile("^/api/v1/public/qr/[^/]+/resolve$");

    private final RedisRateLimiter redisRateLimiter;
    private final AppProperties appProperties;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        RateLimitPolicy policy = resolvePolicy(request);
        if (policy != null) {
            String key = "rate-limit:" + policy.name() + ":" + clientIp(request);
            boolean allowed = redisRateLimiter.isAllowed(key, policy.limit(), Duration.ofMinutes(1));
            if (!allowed) {
                throw new RateLimitExceededException(policy.message());
            }
        }
        filterChain.doFilter(request, response);
    }

    private RateLimitPolicy resolvePolicy(HttpServletRequest request) {
        if (!appProperties.rateLimitingEnabled()) {
            return null;
        }

        String method = request.getMethod();
        String path = request.getRequestURI();

        if ("POST".equalsIgnoreCase(method) && AUTH_ENDPOINTS.contains(path)) {
            return new RateLimitPolicy("auth", appProperties.authRequestsPerMinute(),
                "Too many authentication requests. Please wait a minute and try again.");
        }

        if ("GET".equalsIgnoreCase(method) && PUBLIC_RESOLVE_PATTERN.matcher(path).matches()) {
            return new RateLimitPolicy("public-resolve", appProperties.publicResolveRequestsPerMinute(),
                "Too many QR redirect requests. Please slow down and try again.");
        }

        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String header = request.getHeader("X-Forwarded-For");
        if (header != null && !header.isBlank()) {
            return header.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private record RateLimitPolicy(String name, int limit, String message) {
    }
}
