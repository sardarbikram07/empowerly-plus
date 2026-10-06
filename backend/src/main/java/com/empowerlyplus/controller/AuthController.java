package com.empowerlyplus.controller;

import com.empowerlyplus.dto.LoginRequest;
import com.empowerlyplus.dto.LoginResponse;
import com.empowerlyplus.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Auth controller.
 * POST /api/auth/login is public (no token required).
 */
@Tag(name = "Auth", description = "Authentication endpoints")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Authenticate with email + password.
     * Returns a JWT containing userId, role, branchId, orgId claims.
     */
    @Operation(summary = "Login – returns a signed JWT")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
