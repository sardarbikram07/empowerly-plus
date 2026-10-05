package com.empowerlyplus.domain;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

/**
 * Persistence entity for the "users" collection.
 * Implements UserDetails so Spring Security can use it directly.
 * passwordHash is NEVER returned in API responses (enforced by DTOs).
 */
@Data
@NoArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {

    @Id
    private String id;

    /** BSON ObjectId stored as string; referencing the organizations collection. */
    private String orgId;

    /** BSON ObjectId stored as string; referencing the branches collection. */
    private String branchId;

    private String name;

    @Indexed(unique = true)
    private String email;

    /** BCrypt hash – NEVER expose in DTOs. */
    private String passwordHash;

    /** EMPLOYEE | HR | ADMIN */
    private String role;

    private String department;
    private String designation;
    private Instant joiningDate;

    /** Base monthly salary in BSON double. */
    private double baseSalary;

    private boolean active = true;

    private LeaveBalance leaveBalance = new LeaveBalance();

    // ──────────────────────────────────────────────────────────────────────────
    // UserDetails interface
    // ──────────────────────────────────────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    /** Spring Security uses email as the username. */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return active; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }

    // ──────────────────────────────────────────────────────────────────────────
    // Nested types
    // ──────────────────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    public static class LeaveBalance {
        private int sick   = 0;
        private int casual = 0;
        private int earned = 0;
    }
}
