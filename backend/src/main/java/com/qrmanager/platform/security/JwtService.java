package com.qrmanager.platform.security;

import com.qrmanager.platform.config.AppProperties;
import com.qrmanager.platform.user.Role;
import com.qrmanager.platform.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final AppProperties appProperties;

    public JwtService(AppProperties appProperties) {
        this.appProperties = appProperties;
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(appProperties.jwt().secret()));
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(appProperties.jwt().accessTokenTtlMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("role", user.getRole().name())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(secretKey)
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public AuthenticatedUser toAuthenticatedUser(String token) {
        Claims claims = parse(token);
        return new AuthenticatedUser(
            UUID.fromString(claims.getSubject()),
            claims.get("email", String.class),
            Role.valueOf(claims.get("role", String.class))
        );
    }
}
