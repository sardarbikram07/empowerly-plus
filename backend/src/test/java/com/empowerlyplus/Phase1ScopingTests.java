package com.empowerlyplus;

import com.empowerlyplus.controller.BranchController;
import com.empowerlyplus.controller.UserController;
import com.empowerlyplus.domain.User;
import com.empowerlyplus.dto.*;
import com.empowerlyplus.exception.GlobalExceptionHandler;
import com.empowerlyplus.service.AuthService;
import com.empowerlyplus.service.BranchService;
import com.empowerlyplus.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase1ScopingTests {

    @Mock
    private UserService userService;

    @Mock
    private BranchService branchService;

    @Mock
    private AuthService authService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private UserController userController;

    @InjectMocks
    private BranchController branchController;

    private User adminUser;
    private User hrUser;
    private User employeeUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId("admin-1");
        adminUser.setEmail("admin@empowerly.test");
        adminUser.setRole("ADMIN");
        adminUser.setOrgId("org-1");
        adminUser.setBranchId("branch-hq");

        hrUser = new User();
        hrUser.setId("hr-1");
        hrUser.setEmail("hr@empowerly.test");
        hrUser.setRole("HR");
        hrUser.setOrgId("org-1");
        hrUser.setBranchId("branch-north");

        employeeUser = new User();
        employeeUser.setId("emp-1");
        employeeUser.setEmail("emp@empowerly.test");
        employeeUser.setRole("EMPLOYEE");
        employeeUser.setOrgId("org-1");
        employeeUser.setBranchId("branch-south");
    }

    // ── 1. HR cannot create ADMIN or HR ───────────────────────────────────────

    @Test
    @DisplayName("HR cannot create an ADMIN user")
    void hrCannotCreateAdmin() {
        CreateUserRequest req = new CreateUserRequest();
        req.setName("New Admin");
        req.setEmail("newadmin@empowerly.test");
        req.setPassword("Password@123");
        req.setRole("ADMIN");

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            userController.create(req, hrUser);
        });
        assertEquals("HR cannot create HR or ADMIN users.", ex.getMessage());
    }

    @Test
    @DisplayName("HR cannot create an HR user")
    void hrCannotCreateHr() {
        CreateUserRequest req = new CreateUserRequest();
        req.setName("New HR");
        req.setEmail("newhr@empowerly.test");
        req.setPassword("Password@123");
        req.setRole("HR");

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            userController.create(req, hrUser);
        });
        assertEquals("HR cannot create HR or ADMIN users.", ex.getMessage());
    }

    // ── 2. HR cannot create or update a user in another branch ──────────────

    @Test
    @DisplayName("HR cannot update a user in another branch")
    void hrCannotUpdateUserInAnotherBranch() {
        UserDTO southUserDTO = new UserDTO();
        southUserDTO.setId("user-south-1");
        southUserDTO.setBranchId("branch-south"); // HR is in branch-north
        southUserDTO.setRole("EMPLOYEE");

        when(userService.getById("user-south-1")).thenReturn(southUserDTO);

        UpdateUserRequest req = new UpdateUserRequest();
        req.setName("Updated Name");

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            userController.update("user-south-1", req, hrUser);
        });
        assertEquals("HR cannot update a user in another branch.", ex.getMessage());
    }

    // ── 3. EMPLOYEE cannot change their own role ──────────────────────────────

    @Test
    @DisplayName("EMPLOYEE cannot change their own role")
    void employeeCannotChangeRole() {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setName("Self Update");
        req.setRole("ADMIN"); // Illegal field for EMPLOYEE

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            userController.update("emp-1", req, employeeUser);
        });
        assertEquals("Employees can only update their own name and password.", ex.getMessage());
    }

    // ── 4. Branch listing scope for each role ─────────────────────────────────

    @Test
    @DisplayName("ADMIN sees all branches in organization")
    void adminBranchListingScope() {
        BranchDTO b1 = new BranchDTO(); b1.setId("branch-hq"); b1.setOrgId("org-1");
        BranchDTO b2 = new BranchDTO(); b2.setId("branch-north"); b2.setOrgId("org-1");
        BranchDTO b3 = new BranchDTO(); b3.setId("branch-south"); b3.setOrgId("org-1");

        when(branchService.getAllByOrg("org-1")).thenReturn(List.of(b1, b2, b3));

        ResponseEntity<List<BranchDTO>> response = branchController.list(adminUser);
        assertEquals(3, response.getBody().size());
    }

    @Test
    @DisplayName("HR and EMPLOYEE see only their own branch")
    void hrAndEmployeeBranchListingScope() {
        BranchDTO bNorth = new BranchDTO(); bNorth.setId("branch-north"); bNorth.setOrgId("org-1");
        BranchDTO bSouth = new BranchDTO(); bSouth.setId("branch-south"); bSouth.setOrgId("org-1");

        when(branchService.getById("branch-north")).thenReturn(bNorth);
        when(branchService.getById("branch-south")).thenReturn(bSouth);

        ResponseEntity<List<BranchDTO>> hrRes = branchController.list(hrUser);
        assertEquals(1, hrRes.getBody().size());
        assertEquals("branch-north", hrRes.getBody().get(0).getId());

        ResponseEntity<List<BranchDTO>> empRes = branchController.list(employeeUser);
        assertEquals(1, empRes.getBody().size());
        assertEquals("branch-south", empRes.getBody().get(0).getId());
    }

    @Test
    @DisplayName("HR/EMPLOYEE getOne for another branch throws 403 Forbidden")
    void branchGetOneScoping() {
        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            branchController.getOne("branch-hq", hrUser); // HR is branch-north
        });
        assertEquals("Access denied: you can only view your own branch.", ex.getMessage());
    }

    // ── 5. Wrong password returns 401 without revealing user existence ───────

    @Test
    @DisplayName("Wrong password or invalid email returns 401 Unauthorized")
    void wrongPasswordReturns401() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        BadCredentialsException authEx = new BadCredentialsException("Bad credentials");
        jakarta.servlet.http.HttpServletRequest request = mock(jakarta.servlet.http.HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/auth/login");

        ResponseEntity<Map<String, Object>> response = handler.handleAuth(authEx, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals(401, response.getBody().get("status"));
        assertEquals("Unauthorized", response.getBody().get("error"));
        assertEquals("Bad credentials", response.getBody().get("message"));
        assertEquals("/api/auth/login", response.getBody().get("path"));
    }
}
