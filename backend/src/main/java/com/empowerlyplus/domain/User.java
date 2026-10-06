package com.empowerlyplus.domain;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
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
 *
 * orgId and branchId are stored as BSON ObjectId in MongoDB (not plain strings)
 * so the JSON-Schema validator (bsonType: "objectId") accepts the writes.
 */
@Data
@NoArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {

    @Id
    private String id;

    /**
     * Stored as BSON ObjectId; references the organizations collection.
     * @Field(targetType = OBJECT_ID) tells the Spring Data codec to encode the
     * String value as a BSON ObjectId on the wire.
     */
    @Field(targetType = FieldType.OBJECT_ID)
    private String orgId;

    /**
     * Stored as BSON ObjectId; references the branches collection.
     */
    @Field(targetType = FieldType.OBJECT_ID)
    private String branchId;

    private String name;

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
