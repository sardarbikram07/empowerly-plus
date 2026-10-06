package com.empowerlyplus.repository;

import com.empowerlyplus.domain.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for the "users" collection.
 * Indexes are managed exclusively by db/indexes.js (email unique, text index).
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByOrgId(String orgId);
    List<User> findByBranchId(String branchId);
    List<User> findByBranchIdAndActiveTrue(String branchId);
}
