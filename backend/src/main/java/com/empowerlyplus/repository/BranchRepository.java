package com.empowerlyplus.repository;

import com.empowerlyplus.domain.Branch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for the "branches" collection.
 * Indexes are managed exclusively by db/indexes.js.
 */
@Repository
public interface BranchRepository extends MongoRepository<Branch, String> {
    List<Branch> findByOrgId(String orgId);
    boolean existsByOrgIdAndName(String orgId, String name);
}
