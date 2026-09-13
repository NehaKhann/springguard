package com.springguard.web;

import com.springguard.core.ScanService;
import com.springguard.model.ScanReport;
import com.springguard.model.ScanRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** REST API for SpringGuard. */
@RestController
@RequestMapping("/api")
public class ScanController {

    private final ScanService scanService;

    public ScanController(ScanService scanService) {
        this.scanService = scanService;
    }

    /** Simple health check. */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("SpringGuard is running");
    }

    /** Audit a piece of Spring Boot code/config and return a graded report. */
    @PostMapping("/scan")
    public ResponseEntity<ScanReport> scan(@RequestBody ScanRequest request) {
        ScanReport report = scanService.scan(request.code());
        return ResponseEntity.ok(report);
    }
}
