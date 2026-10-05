package com.empowerlyplus.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT utility service.
 * Generates and validates HMAC-SHA256 signed tokens.
 * Secret and expiry come from environment variables (JWT_SECRET, JWT_EXPIRY_MINUTES).
 */
@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secretString;

    @Value("${app.jwt.expiry-minutes}")
    private long expiryMinutes;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        // Derive a proper HMAC key from the configured secret string.
        // The secret must be at least 32 chars for HS256.
        signingKey = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Token generation
    // ──────────────────────────────────────────────────────────────────────────

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        long nowMs = System.currentTimeMillis();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(nowMs))
                .expiration(new Date(nowMs + expiryMinutes * 60 * 1_000L))
                .signWith(signingKey)
                .compact();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Token validation
    // ──────────────────────────────────────────────────────────────────────────

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claimsResolver.apply(claims);
    }
}
