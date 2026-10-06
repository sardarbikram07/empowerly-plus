package com.empowerlyplus.service;

import com.empowerlyplus.domain.Branch;
import com.empowerlyplus.domain.User;
import com.empowerlyplus.dto.BranchDTO;
import com.empowerlyplus.dto.BranchRequest;
import com.empowerlyplus.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

/**
 * Branch service.
 * Role-based access control is enforced by @PreAuthorize on the controller;
 * this service trusts that the caller already passed the authorization check.
 */
@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;

    // ── List ──────────────────────────────────────────────────────────────────

    /** Returns all branches in the caller's organization. */
    public List<BranchDTO> getAllByOrg(String orgId) {
        return branchRepository.findByOrgId(orgId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    /** Returns a single branch by id, or throws NoSuchElementException. */
    public BranchDTO getById(String id) {
        return toDTO(findOrThrow(id));
    }

    // ── Create ────────────────────────────────────────────────────────────────

    /** ADMIN only. Creates a new branch in the given org. */
    public BranchDTO create(String orgId, BranchRequest req) {
        Branch branch = new Branch();
        branch.setOrgId(orgId);
        branch.setName(req.getName());
        branch.setLocation(req.getLocation());
        return toDTO(branchRepository.save(branch));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /** ADMIN only. Updates name and/or location of an existing branch. */
    public BranchDTO update(String id, BranchRequest req) {
        Branch branch = findOrThrow(id);
        branch.setName(req.getName());
        branch.setLocation(req.getLocation());
        return toDTO(branchRepository.save(branch));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /** ADMIN only. Hard-deletes a branch by id. */
    public void delete(String id) {
        findOrThrow(id); // throws 404 if missing
        branchRepository.deleteById(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Branch findOrThrow(String id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Branch not found: " + id));
    }

    public BranchDTO toDTO(Branch b) {
        BranchDTO dto = new BranchDTO();
        dto.setId(b.getId());
        dto.setOrgId(b.getOrgId());
        dto.setName(b.getName());
        dto.setLocation(b.getLocation());
        return dto;
    }
}
