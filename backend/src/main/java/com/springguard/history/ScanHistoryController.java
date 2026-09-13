package com.springguard.history;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/scans")
public class ScanHistoryController {

    private final ScanHistoryService service;

    public ScanHistoryController(ScanHistoryService service) {
        this.service = service;
    }

    @PostMapping
    public ScanRecordResponse save(@RequestBody SaveScanRequest request) {
        return service.save(request);
    }

    @GetMapping
    public List<ScanRecordResponse> list() {
        return service.listForCurrentUser();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
