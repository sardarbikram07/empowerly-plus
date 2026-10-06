package com.empowerlyplus.controller;

import com.empowerlyplus.domain.User;
import com.empowerlyplus.dto.CreateUserRequest;
import com.empowerlyplus.dto.UpdateUserRequest;
import com.empowerlyplus.dto.UserDTO;
import com.empowerlyplus.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * User CRUD controller.
 *
 * Role-based access (per spec):
 *   GET  /api/users          – ADMIN (all in org) | HR (own branch)
 *   GET  /api/users/{id}     – ADMIN | HR (own branch) | EMPLOYEE (own only)
 *   POST /api/users          – ADMIN | HR (creates in own branch)
 *   PUT  /api/users/{id}     – ADMIN | HR (own branch) | EMPLOYEE (own profile, limited fields)
 *   DELETE /api/users/{id}   – ADMIN only
 *
 * passwordHash is never returned (enforced in UserService.toDTO).
 */
@Tag(name = "Users", description = "User management")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── List ──────────────────────────────────────────────────────────────────

    @Operation(summary = "List users – ADMIN sees org-wide; HR sees own branch")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<List<UserDTO>> list(@AuthenticationPrincipal User caller) {
        List<UserDTO> result = "ADMIN".equals(caller.getRole())
                ? userService.listByOrg(caller.getOrgId())
                : userService.listByBranch(caller.getBranchId());
        return ResponseEntity.ok(result);
    }

    // ── Get ───────────────────────────────────────────────────────────────────

    @Operation(summary = "Get a user – ADMIN/HR org-wide; EMPLOYEE sees own only")
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getOne(
            @PathVariable String id,
            @AuthenticationPrincipal User caller) {

        // EMPLOYEE can only read their own profile
        if ("EMPLOYEE".equals(caller.getRole()) && !caller.getId().equals(id)) {
            throw new AccessDeniedException("Employees can only view their own profile.");
        }
        UserDTO dto = userService.getById(id);
        if ("HR".equals(caller.getRole()) && !caller.getBranchId().equals(dto.getBranchId())) {
            throw new AccessDeniedException("HR can only view users in their own branch.");
        }
        return ResponseEntity.ok(dto);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Operation(summary = "Create a user – ADMIN or HR")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<UserDTO> create(
            @Valid @RequestBody CreateUserRequest req,
            @AuthenticationPrincipal User caller) {

        String branchId;
        if ("ADMIN".equals(caller.getRole())) {
            // ADMIN may specify any branch; defaults to own if not provided
            branchId = (req.getBranchId() != null && !req.getBranchId().isBlank())
                    ? req.getBranchId()
                    : caller.getBranchId();
        } else {
            // HR can only create users in their own branch
            branchId = caller.getBranchId();
        }

        UserDTO created = userService.create(caller.getOrgId(), branchId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Operation(summary = "Update a user – ADMIN/HR or own profile (EMPLOYEE)")
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest req,
            @AuthenticationPrincipal User caller) {

        String callerRole = caller.getRole();

        // EMPLOYEE can only edit their own profile
        if ("EMPLOYEE".equals(callerRole) && !caller.getId().equals(id)) {
            throw new AccessDeniedException("Employees can only update their own profile.");
        }
        if ("HR".equals(callerRole)) {
            UserDTO target = userService.getById(id);
            if (!caller.getBranchId().equals(target.getBranchId())) {
                throw new AccessDeniedException("HR can only update users in their own branch.");
            }
        }

        boolean isAdmin = "ADMIN".equals(callerRole);
        return ResponseEntity.ok(userService.update(id, req, isAdmin));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Operation(summary = "Delete a user (ADMIN only)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
