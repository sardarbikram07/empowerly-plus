package com.empowerlyplus.security;

import com.empowerlyplus.domain.User;
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
 *
 * Token payload includes the custom claims required by the spec:
 *   sub      → email (Spring Security principal)
 *   userId   → MongoDB _id (hex string)
 *   role     → EMPLOYEE | HR | ADMIN
 *   branchId → hex string
 *   orgId    → hex string
 *
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
        if (secretString == null || secretString.length() < 32 || secretString.toLowerCase().startsWith("mongodb")) {
            throw new IllegalStateException(
                    "FATAL: app.jwt.secret must be at least 32 characters and cannot be the MongoDB URI.");
        }
        signingKey = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Token generation
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Generates a JWT for a User entity, embedding all four spec-required claims.
     */
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId",   user.getId());
        claims.put("role",     user.getRole());
        claims.put("branchId", user.getBranchId());
        claims.put("orgId",    user.getOrgId());
        return buildToken(claims, user);
    }

    /** Overload kept for backward compatibility (e.g. tests). */
    public String generateToken(UserDetails userDetails) {
        if (userDetails instanceof User u) {
            return generateToken(u);
        }
        return buildToken(new HashMap<>(), userDetails);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails) {
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

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }
}
