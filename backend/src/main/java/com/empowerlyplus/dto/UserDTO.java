package com.empowerlyplus.dto;

import com.empowerlyplus.domain.User;
import lombok.Data;

/**
 * DTO representing a user in API responses.
 * passwordHash is intentionally absent from this class.
 */
@Data
public class UserDTO {
    private String id;
    private String orgId;
    private String branchId;
    private String name;
    private String email;
    private String role;
    private String department;
    private String designation;
    private String joiningDate;
    private double baseSalary;
    private boolean active;
    private LeaveBalanceDTO leaveBalance;

    @Data
    public static class LeaveBalanceDTO {
        private int sick;
        private int casual;
        private int earned;
    }
}
