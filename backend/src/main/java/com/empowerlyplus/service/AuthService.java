package com.empowerlyplus.service;

import com.empowerlyplus.domain.User;
import com.empowerlyplus.dto.LoginRequest;
import com.empowerlyplus.dto.LoginResponse;
import com.empowerlyplus.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * Auth service.
 * Delegates credential verification to Spring Security's AuthenticationManager,
 * then wraps the authenticated User in a JWT with the four spec-required claims.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    /**
     * Authenticates the user and returns a JWT + user summary.
     * Throws AuthenticationException (handled by GlobalExceptionHandler) on bad credentials.
     */
    public LoginResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = (User) auth.getPrincipal();
        String token = jwtService.generateToken(user);

        LoginResponse.UserSummary summary = new LoginResponse.UserSummary(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getBranchId(),
                user.getOrgId()
        );

        return new LoginResponse(token, summary);
    }
}
