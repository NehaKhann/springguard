package com.springguard.model.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "scan_records")
public class ScanRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String grade;

    @Column(nullable = false)
    private int score;

    @Column(length = 1000)
    private String summary;

    // The findings, stored as a JSON string.
    @Column(columnDefinition = "TEXT")
    private String findingsJson;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getFindingsJson() { return findingsJson; }
    public void setFindingsJson(String findingsJson) { this.findingsJson = findingsJson; }
    public Instant getCreatedAt() { return createdAt; }
}
