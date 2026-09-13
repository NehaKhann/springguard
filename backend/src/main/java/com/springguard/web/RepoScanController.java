package com.springguard.web;

import com.springguard.github.RepoScanRequest;
import com.springguard.github.RepoScanService;
import com.springguard.model.RepoScanReport;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class RepoScanController {

    private final RepoScanService repoScanService;

    public RepoScanController(RepoScanService repoScanService) {
        this.repoScanService = repoScanService;
    }

    @PostMapping("/scan-repo")
    public ResponseEntity<RepoScanReport> scanRepo(@RequestBody RepoScanRequest request) {
        return ResponseEntity.ok(repoScanService.scan(request.repoUrl(), request.token(), request.branch()));
    }
}
