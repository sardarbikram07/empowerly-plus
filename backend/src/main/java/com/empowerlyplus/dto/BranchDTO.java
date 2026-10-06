package com.empowerlyplus.dto;

import lombok.Data;

/**
 * DTO representing a branch returned by the API.
 * Never exposes internal Mongo document fields beyond what the client needs.
 */
@Data
public class BranchDTO {
    private String id;
    private String orgId;
    private String name;
    private String location;
}
