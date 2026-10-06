package com.empowerlyplus.controller;

import com.empowerlyplus.domain.User;
import com.empowerlyplus.dto.BranchDTO;
import com.empowerlyplus.dto.BranchRequest;
import com.empowerlyplus.service.BranchService;
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
 * Branch CRUD controller.
 *
 * Role-based access rules:
 *   GET /api/branches       – ADMIN sees all branches in org; HR/EMPLOYEE see only own branch.
 *   GET /api/branches/{id}  – ADMIN sees any branch in org; HR/EMPLOYEE see only own branch (403 otherwise).
 *   POST /api/branches      – ADMIN only
 *   PUT /api/branches/{id}  – ADMIN only
 *   DELETE /api/branches/{id} – ADMIN only
 */
@Tag(name = "Branches", description = "Branch management")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @Operation(summary = "List branches in the caller's organization")
    @GetMapping
    public ResponseEntity<List<BranchDTO>> list(@AuthenticationPrincipal User caller) {
        if ("ADMIN".equals(caller.getRole())) {
            return ResponseEntity.ok(branchService.getAllByOrg(caller.getOrgId()));
        } else {
            return ResponseEntity.ok(List.of(branchService.getById(caller.getBranchId())));
        }
    }

    @Operation(summary = "Get a single branch by id")
    @GetMapping("/{id}")
    public ResponseEntity<BranchDTO> getOne(
            @PathVariable String id,
            @AuthenticationPrincipal User caller) {
        if ("ADMIN".equals(caller.getRole())) {
            BranchDTO dto = branchService.getById(id);
            if (!dto.getOrgId().equals(caller.getOrgId())) {
                throw new AccessDeniedException("Access denied to branches outside your organization.");
            }
            return ResponseEntity.ok(dto);
        } else {
            if (!id.equals(caller.getBranchId())) {
                throw new AccessDeniedException("Access denied: you can only view your own branch.");
            }
            return ResponseEntity.ok(branchService.getById(id));
        }
    }

    @Operation(summary = "Create a new branch (ADMIN only)")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BranchDTO> create(
            @AuthenticationPrincipal User caller,
            @Valid @RequestBody BranchRequest req) {
        BranchDTO created = branchService.create(caller.getOrgId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Update a branch (ADMIN only)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BranchDTO> update(
            @PathVariable String id,
            @Valid @RequestBody BranchRequest req) {
        return ResponseEntity.ok(branchService.update(id, req));
    }

    @Operation(summary = "Delete a branch (ADMIN only)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        branchService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
