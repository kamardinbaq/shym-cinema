package com.cinema.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Simple in-memory per-IP rate limiter.
 * Resets counts every minute. Not suitable for multi-instance deployments
 * (use Redis-based limiter for that).
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.requests-per-minute:60}")
    private int maxRequestsPerMinute;

    private final ConcurrentHashMap<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final AtomicLong currentWindowStart = new AtomicLong(System.currentTimeMillis());

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        long now = System.currentTimeMillis();

        // Reset window every 60 seconds — CAS ensures only one thread resets
        long windowStart = currentWindowStart.get();
        if (now - windowStart > 60_000 && currentWindowStart.compareAndSet(windowStart, now)) {
            requestCounts.clear();
        }

        String clientIp = getClientIp(request);
        AtomicInteger count = requestCounts.computeIfAbsent(clientIp, k -> new AtomicInteger(0));

        if (count.incrementAndGet() > maxRequestsPerMinute) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Too many requests. Please wait a moment.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
