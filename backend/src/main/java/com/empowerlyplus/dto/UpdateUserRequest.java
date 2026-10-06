package com.empowerlyplus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Request body for updating a user.
 * All fields are optional; null means "no change".
 * Only an ADMIN can change role or branchId.
 */
@Data
public class UpdateUserRequest {

    private String name;

    @Email(message = "Email must be valid")
    private String email;

    // At least 6 chars if provided
    private String password;

    @Pattern(regexp = "EMPLOYEE|HR|ADMIN|^$", message = "Role must be EMPLOYEE, HR, or ADMIN")
    private String role;

    private String branchId;
    private String department;
    private String designation;
    private Double baseSalary;
    private Boolean active;
}
