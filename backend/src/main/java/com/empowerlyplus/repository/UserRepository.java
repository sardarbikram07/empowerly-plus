package com.empowerlyplus.repository;

import com.empowerlyplus.domain.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for the "users" collection.
 * Index on email (unique) is created by db/indexes.js, not by Spring.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
