package com.springguard.history;

import java.util.List;

public record ScanRecordResponse(Long id, String grade, int score, String summary,
                                 String createdAt, List<FindingDto> findings) {}
