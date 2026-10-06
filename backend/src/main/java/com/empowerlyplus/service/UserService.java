package com.empowerlyplus.service;

import com.empowerlyplus.domain.User;
import com.empowerlyplus.dto.CreateUserRequest;
import com.empowerlyplus.dto.UpdateUserRequest;
import com.empowerlyplus.dto.UserDTO;
import com.empowerlyplus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

/**
 * User service.
 * Enforces scope rules per the spec:
 *   - EMPLOYEE  → own record only (enforced in controller via @AuthenticationPrincipal)
 *   - HR        → own branch only
 *   - ADMIN     → org-wide
 *
 * passwordHash is NEVER returned to callers; toDTO() omits it.
 * All passwords are BCrypt-hashed before persisting.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Default leave balance per spec ────────────────────────────────────────
    private static User.LeaveBalance defaultLeaveBalance() {
        User.LeaveBalance lb = new User.LeaveBalance();
        lb.setSick(10);
        lb.setCasual(12);
        lb.setEarned(15);
        return lb;
    }

    // ── List ──────────────────────────────────────────────────────────────────

    /** ADMIN: all users in the org. */
    public List<UserDTO> listByOrg(String orgId) {
        return userRepository.findByOrgId(orgId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    /** HR: all users in their own branch. */
    public List<UserDTO> listByBranch(String branchId) {
        return userRepository.findByBranchId(branchId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // ── Get ───────────────────────────────────────────────────────────────────

    public UserDTO getById(String id) {
        return toDTO(findOrThrow(id));
    }

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Creates a new user, hashing the password and initialising leave balance.
     * @param orgId     the caller's org (set by controller from principal)
     * @param req       the create request (branchId may be overridden by HR's own branch)
     */
    public UserDTO create(String orgId, String branchId, CreateUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("A user with that email already exists.");
        }

        User user = new User();
        user.setOrgId(orgId);
        user.setBranchId(branchId);
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole());
        user.setDepartment(req.getDepartment());
        user.setDesignation(req.getDesignation());
        user.setBaseSalary(req.getBaseSalary() != null ? req.getBaseSalary() : 0.0);
        user.setActive(true);
        user.setLeaveBalance(defaultLeaveBalance());

        return toDTO(userRepository.save(user));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /**
     * Applies a partial update to the user.
     * The controller is responsible for ensuring the caller has permission to
     * update this record and which fields they may change.
     */
    public UserDTO update(String id, UpdateUserRequest req, boolean callerIsAdmin) {
        User user = findOrThrow(id);

        if (req.getName()        != null) user.setName(req.getName());
        if (req.getEmail()       != null) user.setEmail(req.getEmail());
        if (req.getPassword()    != null) user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        if (req.getDepartment()  != null) user.setDepartment(req.getDepartment());
        if (req.getDesignation() != null) user.setDesignation(req.getDesignation());
        if (req.getBaseSalary()  != null) user.setBaseSalary(req.getBaseSalary());
        if (req.getActive()      != null) user.setActive(req.getActive());

        // Only ADMIN may change role or branchId
        if (callerIsAdmin) {
            if (req.getRole()     != null) user.setRole(req.getRole());
            if (req.getBranchId() != null) user.setBranchId(req.getBranchId());
        }

        return toDTO(userRepository.save(user));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /** ADMIN only. */
    public void delete(String id) {
        findOrThrow(id);
        userRepository.deleteById(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findOrThrow(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + id));
    }

    public UserDTO toDTO(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setOrgId(u.getOrgId());
        dto.setBranchId(u.getBranchId());
        dto.setName(u.getName());
        dto.setEmail(u.getEmail());
        dto.setRole(u.getRole());
        dto.setDepartment(u.getDepartment());
        dto.setDesignation(u.getDesignation());
        dto.setJoiningDate(u.getJoiningDate() != null ? u.getJoiningDate().toString() : null);
        dto.setBaseSalary(u.getBaseSalary());
        dto.setActive(u.isActive());

        if (u.getLeaveBalance() != null) {
            UserDTO.LeaveBalanceDTO lb = new UserDTO.LeaveBalanceDTO();
            lb.setSick(u.getLeaveBalance().getSick());
            lb.setCasual(u.getLeaveBalance().getCasual());
            lb.setEarned(u.getLeaveBalance().getEarned());
            dto.setLeaveBalance(lb);
        }
        return dto;
    }
}
