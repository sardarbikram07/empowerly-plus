package com.empowerlyplus.domain;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/**
 * Persistence entity for the "organizations" collection.
 * validator requires: name (string, non-empty).
 */
@Data
@NoArgsConstructor
@Document(collection = "organizations")
public class Organization {

    @Id
    private String id;

    private String name;
}
