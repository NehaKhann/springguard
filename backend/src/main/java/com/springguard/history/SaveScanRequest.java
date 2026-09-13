package com.springguard.history;

import java.util.List;

public record SaveScanRequest(String grade, int score, String summary, List<FindingDto> findings) {}
