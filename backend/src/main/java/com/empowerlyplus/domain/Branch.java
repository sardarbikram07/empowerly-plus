package com.empowerlyplus.domain;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/**
 * Persistence entity for the "branches" collection.
 * Validator requires: orgId (objectId), name, location.
 */
@Data
@NoArgsConstructor
@Document(collection = "branches")
public class Branch {

    @Id
    private String id;

    /**
     * Stored as BSON ObjectId; references the organizations collection.
     */
    @Field(targetType = FieldType.OBJECT_ID)
    private String orgId;

    private String name;
    private String location;
}
