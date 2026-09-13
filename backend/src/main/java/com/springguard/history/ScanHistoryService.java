package com.springguard.history;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.springguard.model.entity.ScanRecord;
import com.springguard.model.entity.User;
import com.springguard.repo.ScanRecordRepository;
import com.springguard.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ScanHistoryService {

    private final UserRepository users;
    private final ScanRecordRepository records;
    private final ObjectMapper mapper;

    public ScanHistoryService(UserRepository users, ScanRecordRepository records, ObjectMapper mapper) {
        this.users = users;
        this.records = records;
        this.mapper = mapper;
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in.");
        }
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in."));
    }

    public ScanRecordResponse save(SaveScanRequest req) {
        ScanRecord record = new ScanRecord();
        record.setUser(currentUser());
        record.setGrade(req.grade());
        record.setScore(req.score());
        record.setSummary(req.summary());
        record.setFindingsJson(writeFindings(req.findings()));
        records.save(record);
        return toResponse(record);
    }

    public List<ScanRecordResponse> listForCurrentUser() {
        return records.findByUserOrderByCreatedAtDesc(currentUser())
                .stream().map(this::toResponse).toList();
    }

    public void delete(Long id) {
        ScanRecord record = records.findByIdAndUser(id, currentUser())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scan not found."));
        records.delete(record);
    }

    private ScanRecordResponse toResponse(ScanRecord r) {
        return new ScanRecordResponse(r.getId(), r.getGrade(), r.getScore(), r.getSummary(),
                r.getCreatedAt().toString(), readFindings(r.getFindingsJson()));
    }

    private String writeFindings(List<FindingDto> findings) {
        try {
            return mapper.writeValueAsString(findings == null ? List.of() : findings);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<FindingDto> readFindings(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return mapper.readValue(json, new TypeReference<List<FindingDto>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
