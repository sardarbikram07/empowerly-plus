package com.empowerlyplus.controller;

import com.mongodb.client.MongoClient;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health endpoint.
 * GET /api/health returns the application status and a MongoDB ping result.
 * This endpoint is public (no auth required) and is used to verify the
 * Atlas connection is working.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final MongoTemplate mongoTemplate;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        String mongoPing = checkMongoPing();

        return ResponseEntity.ok(Map.of(
                "status",    "UP",
                "mongoPing", mongoPing,
                "timestamp", Instant.now().toString()
        ));
    }

    /**
     * Issues a MongoDB { ping: 1 } command and returns "ok" or an error message.
     * A successful ping against Atlas confirms the URI, credentials and network
     * access rules are all correct.
     */
    private String checkMongoPing() {
        try {
            Document result = mongoTemplate.executeCommand(new Document("ping", 1));
            // MongoDB may return "ok" as BSON int32 (Integer) or double depending on driver version.
            Number ok = (Number) result.get("ok");
            return (ok != null && ok.doubleValue() == 1.0) ? "ok" : "unexpected response: " + result.toJson();
        } catch (Exception e) {
            return "error: " + e.getMessage();
        }
    }
}
