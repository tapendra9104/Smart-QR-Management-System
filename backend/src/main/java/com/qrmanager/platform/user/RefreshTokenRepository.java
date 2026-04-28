package com.qrmanager.platform.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUserIdAndRevokedAtIsNull(UUID userId);

    @Modifying
    @Query("""
        delete from RefreshToken token
        where token.expiresAt < :cutoff
           or (token.revokedAt is not null and token.revokedAt < :cutoff)
        """)
    long deleteExpiredOrRevokedBefore(@Param("cutoff") Instant cutoff);
}
