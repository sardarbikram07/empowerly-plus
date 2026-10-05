package com.empowerlyplus;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Smoke test – verifies the application context loads.
 * Uses the "test" profile so that a real MongoDB URI is not required in CI.
 * For local runs, the .env file in backend/ provides the real Atlas URI.
 */
@SpringBootTest
@ActiveProfiles("test")
class EmpowerlyplusApplicationTests {

    @Test
    void contextLoads() {
        // If this method runs without throwing, the Spring context loaded successfully.
    }
}
