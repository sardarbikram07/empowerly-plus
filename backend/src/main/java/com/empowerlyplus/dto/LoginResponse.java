package com.empowerlyplus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response body for POST /api/auth/login.
 * Contains the signed JWT and a user summary (passwordHash excluded).
 */
@Data
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private UserSummary user;

    @Data
    @AllArgsConstructor
    public static class UserSummary {
        private String id;
        private String name;
        private String email;
        private String role;
        private String branchId;
        private String orgId;
    }
}
