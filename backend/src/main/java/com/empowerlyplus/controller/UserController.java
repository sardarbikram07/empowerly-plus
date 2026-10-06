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
 * Scoping rules:
 *   GET /api/users         – ADMIN sees org-wide; HR sees own branch; EMPLOYEE forbidden (403).
 *   GET /api/users/{id}    – ADMIN sees any user; HR sees own branch users; EMPLOYEE sees own profile only.
 *   POST /api/users        – ADMIN creates any role/branch; HR creates EMPLOYEE only in own branch.
 *   PUT /api/users/{id}    – ADMIN updates any fields; HR updates EMPLOYEE in own branch; EMPLOYEE updates own name/password only.
 *   DELETE /api/users/{id} – ADMIN only.
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

    @Operation(summary = "Get a user by ID")
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getOne(
            @PathVariable String id,
            @AuthenticationPrincipal User caller) {

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

        if ("HR".equals(caller.getRole())) {
            // HR can only create EMPLOYEE users in their own branch
            if (req.getRole() != null && !"EMPLOYEE".equals(req.getRole())) {
                throw new AccessDeniedException("HR cannot create HR or ADMIN users.");
            }
            req.setRole("EMPLOYEE");
            UserDTO created = userService.create(caller.getOrgId(), caller.getBranchId(), req);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        }

        // ADMIN
        String branchId = (req.getBranchId() != null && !req.getBranchId().isBlank())
                ? req.getBranchId()
                : caller.getBranchId();

        UserDTO created = userService.create(caller.getOrgId(), branchId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Operation(summary = "Update a user – ADMIN, HR, or own profile (EMPLOYEE)")
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest req,
            @AuthenticationPrincipal User caller) {

        String callerRole = caller.getRole();

        if ("EMPLOYEE".equals(callerRole)) {
            if (!caller.getId().equals(id)) {
                throw new AccessDeniedException("Employees can only update their own profile.");
            }
            // Enforce that employees cannot change role, branch, salary, active, department, designation
            if (req.getRole() != null || req.getBranchId() != null || req.getBaseSalary() != null ||
                req.getActive() != null || req.getDepartment() != null || req.getDesignation() != null) {
                throw new AccessDeniedException("Employees can only update their own name and password.");
            }
            UpdateUserRequest sanitized = new UpdateUserRequest();
            sanitized.setName(req.getName());
            sanitized.setPassword(req.getPassword());
            return ResponseEntity.ok(userService.update(id, sanitized, caller));
        }

        if ("HR".equals(callerRole)) {
            UserDTO target = userService.getById(id);
            if (!caller.getBranchId().equals(target.getBranchId())) {
                throw new AccessDeniedException("HR cannot update a user in another branch.");
            }
            if (!"EMPLOYEE".equals(target.getRole())) {
                throw new AccessDeniedException("HR can only update EMPLOYEE users.");
            }
            if (req.getRole() != null && !"EMPLOYEE".equals(req.getRole())) {
                throw new AccessDeniedException("HR cannot promote users to HR or ADMIN.");
            }
            if (req.getBranchId() != null && !caller.getBranchId().equals(req.getBranchId())) {
                throw new AccessDeniedException("HR cannot move a user to another branch.");
            }

            UpdateUserRequest sanitized = new UpdateUserRequest();
            sanitized.setName(req.getName());
            sanitized.setEmail(req.getEmail());
            sanitized.setPassword(req.getPassword());
            sanitized.setDepartment(req.getDepartment());
            sanitized.setDesignation(req.getDesignation());
            sanitized.setBaseSalary(req.getBaseSalary());
            sanitized.setActive(req.getActive());
            // role and branchId remain untouched
            return ResponseEntity.ok(userService.update(id, sanitized, caller));
        }

        // ADMIN
        return ResponseEntity.ok(userService.update(id, req, caller));
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
