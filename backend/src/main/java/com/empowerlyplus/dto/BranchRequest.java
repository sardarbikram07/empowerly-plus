package com.empowerlyplus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for creating or updating a branch.
 */
@Data
public class BranchRequest {

    @NotBlank(message = "Branch name is required")
    private String name;

    @NotBlank(message = "Location is required")
    private String location;
}
