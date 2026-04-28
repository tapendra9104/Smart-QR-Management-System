package com.qrmanager.platform.security;

import com.qrmanager.platform.integration.apikey.ApiKey;
import com.qrmanager.platform.integration.apikey.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;

    public ApiKeyAuthenticationFilter(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKeyValue = resolveApiKey(request);
        if (StringUtils.hasText(apiKeyValue)) {
            try {
                ApiKey apiKey = apiKeyService.authenticate(apiKeyValue);
                AuthenticatedUser user = new AuthenticatedUser(
                    apiKey.getUser().getId(),
                    apiKey.getUser().getEmail(),
                    apiKey.getUser().getRole()
                );
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    user,
                    "api-key",
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name()))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
                apiKeyService.recordUse(apiKey);
            } catch (RuntimeException ignored) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveApiKey(HttpServletRequest request) {
        String directHeader = request.getHeader("X-API-Key");
        if (StringUtils.hasText(directHeader)) {
            return directHeader.trim();
        }

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(authorization) && authorization.startsWith("ApiKey ")) {
            return authorization.substring("ApiKey ".length()).trim();
        }

        return null;
    }
}
