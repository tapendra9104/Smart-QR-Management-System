package com.qrmanager.platform.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.regex.Pattern;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ForwardedHeaderSanitizingFilter extends OncePerRequestFilter {

    private static final Pattern IPV4_WITH_PORT = Pattern.compile("^(\\d{1,3}(?:\\.\\d{1,3}){3}):(\\d+)$");
    private static final Pattern IPV6_LOOPBACK_WITH_PORT = Pattern.compile("^(::1):(\\d+)$");
    private static final Pattern BRACKETED_IPV6_WITH_OPTIONAL_PORT = Pattern.compile("^\\[([^\\]]+)](?::\\d+)?$");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        String original = request.getHeader("X-Forwarded-For");
        String sanitized = sanitizeForwardedFor(original);
        if (original == null || original.equals(sanitized)) {
            filterChain.doFilter(request, response);
            return;
        }

        filterChain.doFilter(new SanitizedForwardedForRequest(request, sanitized), response);
    }

    private String sanitizeForwardedFor(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }

        List<String> addresses = Pattern.compile(",")
            .splitAsStream(value)
            .map(String::trim)
            .map(this::sanitizeAddress)
            .filter(address -> address != null && !address.isBlank())
            .toList();
        return addresses.isEmpty() ? null : String.join(", ", addresses);
    }

    private String sanitizeAddress(String value) {
        var bracketed = BRACKETED_IPV6_WITH_OPTIONAL_PORT.matcher(value);
        if (bracketed.matches()) {
            return bracketed.group(1);
        }

        var loopback = IPV6_LOOPBACK_WITH_PORT.matcher(value);
        if (loopback.matches()) {
            return loopback.group(1);
        }

        var ipv4WithPort = IPV4_WITH_PORT.matcher(value);
        if (ipv4WithPort.matches()) {
            return ipv4WithPort.group(1);
        }

        return value;
    }

    private static class SanitizedForwardedForRequest extends HttpServletRequestWrapper {
        private final String forwardedFor;

        SanitizedForwardedForRequest(HttpServletRequest request, String forwardedFor) {
            super(request);
            this.forwardedFor = forwardedFor;
        }

        @Override
        public String getHeader(String name) {
            if ("X-Forwarded-For".equalsIgnoreCase(name)) {
                return forwardedFor;
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if ("X-Forwarded-For".equalsIgnoreCase(name)) {
                return forwardedFor == null
                    ? Collections.emptyEnumeration()
                    : Collections.enumeration(List.of(forwardedFor));
            }
            return super.getHeaders(name);
        }
    }
}
