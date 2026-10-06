package com.empowerlyplus.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Request body for creating a new user.
 * HR or ADMIN submits this; the service hashes the password before persisting.
 */
@Data
public class CreateUserRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "EMPLOYEE|HR|ADMIN", message = "Role must be EMPLOYEE, HR, or ADMIN")
    private String role;

    /** Required when ADMIN creates a user in a specific branch. */
    private String branchId;

    private String department;
    private String designation;
    private Double baseSalary;
}
