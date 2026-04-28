package com.qrmanager.platform.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@Slf4j
@RequiredArgsConstructor
public class RedisRateLimiter {

    private final StringRedisTemplate redisTemplate;

    public boolean isAllowed(String key, int limit, Duration window) {
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redisTemplate.expire(key, window);
            }
            return count == null || count <= limit;
        } catch (Exception exception) {
            log.warn("Rate limiting unavailable for key {}, allowing request", key, exception);
            return true;
        }
    }
}
