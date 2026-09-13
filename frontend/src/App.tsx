import React, { useEffect, useState } from 'react'
import { scanCode, scanRepo, saveScan, listScans, deleteScan, fixCode, fixRepoFile } from './api'
import type { Finding, ScanReport, Severity, AuthResponse, ScanRecordResponse } from './types'
import HistoryPanel from './HistoryPanel'
import Landing from './Landing'
import DiffView from './DiffView'
import ShieldIcon from './ShieldIcon'
import { makeZip } from './zip'

const SAMPLE = `// SecurityConfig.java + application.properties (sample)
http
  .csrf().disable()
  .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

@CrossOrigin(origins = "*")
@RestController
class UserController {
  @GetMapping("/users/{id}")
  User get(@PathVariable Long id) {
    try { return repo.findById(id).get(); }
    catch (Exception e) { throw new RuntimeException(e.getMessage()); }
  }
}

# application.properties
management.endpoints.web.exposure.include=*
spring.datasource.password=admin123
jwt.secret=secret
jwt.expiration=0`

const GRADE_COLOR: Record<string, string> = {
  A: 'var(--green)', B: 'var(--green)', C: 'var(--amber)', D: 'var(--orange)', F: 'var(--red)',
}
const SEV_LABEL: Record<Severity, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }

type Mode = 'code' | 'repo'

function SkeletonLoader({ mode }: { mode: Mode }) {
  return (
    <div className="skeleton-report" aria-busy="true" aria-label="Loading scan results">
      <div className="skeleton-scorecards">
        <div className="skel-gradecard">
          <div className="skel skel-grade-circle" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="skel skel-line w-30" />
            <div className="skel skel-line w-50" />
            <div className="skel skel-line w-70" />
            <div className="skel skel-line w-30" style={{ marginTop: 4 }} />
          </div>
        </div>
        {mode === 'code' && (
          <div className="skel-aicard">
            <div className="skel skel-line w-30" />
            <div className="skel skel-line w-50" />
            <div className="skel skel-line w-70" />
          </div>
        )}
      </div>
      <div className="skel-findings">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="skel-finding">
            <div className="skel skel-line w-30" />
            <div className="skel skel-line w-full" />
            <div className="skel skel-line w-70" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Severity chip row shown under a fix panel ("Resolving: X, Y, Z"). */
function ResolvingChips({ findings }: { findings: Finding[] }) {
  return (
    <div className="fix-resolving">
      <span className="fix-resolving-label">Resolving</span>
      {findings.map((f, i) => (
        <span key={i} className={`fix-issue is-${String(f.severity).toLowerCase()}`}>{f.title}</span>
      ))}
    </div>
  )
}

/** Header used by both the code-mode and repo-mode "AI auto-fix" panels. */
function FixPanelHeader({ subtitle, action }: { subtitle: string; action: React.ReactNode }) {
  return (
    <div className="fixpanel-head">
      <div>
        <div className="cardlabel ai">AI auto-fix</div>
        <div className="fixpanel-sub">{subtitle}</div>
      </div>
      {action}
    </div>
  )
}

export default function App() {
  const [mode, setMode] = useState<Mode>('code')
  const [code, setCode] = useState(SAMPLE)
  const [repoUrl, setRepoUrl] = useState('')
  const [repoToken, setRepoToken] = useState('')
  const [repoBranch, setRepoBranch] = useState('')

  const [report, setReport] = useState<ScanReport | null>(null)
  const [reportMode, setReportMode] = useState<Mode>('code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sg_token'))
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem('sg_email'))
  const [guest, setGuest] = useState(false)
  const [history, setHistory] = useState<ScanRecordResponse[]>([])
  const [saved, setSaved] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [fixedCode, setFixedCode] = useState<string | null>(null)
  const [fixing, setFixing] = useState(false)
  const [fixMsg, setFixMsg] = useState<string | null>(null)
  const [repoFixes, setRepoFixes] = useState<Record<string, { original: string; fixedCode: string }>>({})
  const [fixingPath, setFixingPath] = useState<string | null>(null)
  const [repoFixMsg, setRepoFixMsg] = useState<string | null>(null)
  const [fixingAll, setFixingAll] = useState(false)
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})

  const analyzed = report && report.status === 'ANALYZED'
  const aiFindings = report ? report.findings.filter((f) => f.source === 'AI') : []
  const aiHigh = aiFindings.filter((f) => f.severity === 'HIGH').length
  const aiMed = aiFindings.filter((f) => f.severity === 'MEDIUM').length
  const aiLow = aiFindings.filter((f) => f.severity === 'LOW').length

  function onAuth(res: AuthResponse) {
    setToken(res.token)
    setEmail(res.email)
    localStorage.setItem('sg_token', res.token)
    localStorage.setItem('sg_email', res.email)
    setReport(null)
    setError(null)
    setSaved(false)
    setSaveMsg(null)
  }
  function signOut() {
    setToken(null)
    setEmail(null)
    localStorage.removeItem('sg_token')
    localStorage.removeItem('sg_email')
    setGuest(false)
    setHistory([])
    setSaved(false)
    setSaveMsg(null)
    setReport(null)
    setError(null)
  }

  async function refreshHistory() {
    if (!token) return
    try { setHistory(await listScans(token)) } catch { /* ignore */ }
  }

  async function handleDelete(id: number) {
    if (!token) return
    try {
      await deleteScan(token, id)
      refreshHistory()
    } catch { /* ignore */ }
  }
  useEffect(() => { refreshHistory() /* eslint-disable-next-line */ }, [token])

  function beforeScan() {
    setLoading(true); setError(null); setReport(null); setSaved(false); setSaveMsg(null)
    setFixedCode(null); setFixMsg(null)
    setRepoFixes({}); setRepoFixMsg(null); setFixingPath(null)
    setFixingAll(false); setAccepted({})
  }

  async function runScan() {
    beforeScan()
    try {
      setReport(await scanCode(code))
      setReportMode('code')
    } catch {
      setError("Couldn't reach the scanner. Make sure the backend is running, then scan again.")
    } finally {
      setLoading(false)
    }
  }

  async function runRepoScan() {
    beforeScan()
    try {
      setReport(await scanRepo(repoUrl, repoToken || undefined, repoBranch || undefined))
      setReportMode('repo')
    } catch {
      setError("Couldn't reach the scanner. Please try again in a moment.")
    } finally {
      setLoading(false)
    }
  }

  async function saveCurrent() {
    if (!token || !report || !analyzed) return
    setSaveMsg(null)
    try {
      await saveScan(token, { grade: report.grade, score: report.score, summary: report.summary, findings: report.findings })
      setSaved(true)
      refreshHistory()
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Could not save this scan.')
    }
  }

  async function runFix() {
    setFixing(true); setFixMsg(null); setFixedCode(null)
    try {
      const res = await fixCode(code)
      if (res.status === 'OK' && res.fixedCode) {
        setFixedCode(res.fixedCode)
      } else {
        setFixMsg(res.message || 'Could not generate a fix.')
      }
    } catch {
      setFixMsg("Couldn't reach the fixer. Please try again.")
    } finally {
      setFixing(false)
    }
  }

  function applyFix() {
    if (fixedCode) { setCode(fixedCode); setFixedCode(null); setReport(null); setFixMsg(null) }
  }

  async function fixAllRepoFiles(paths: string[]) {
    setRepoFixMsg(null); setFixingAll(true)
    for (const path of paths) {
      if (repoFixes[path]) continue
      setFixingPath(path)
      try {
        const res = await fixRepoFile(repoUrl, repoToken, repoBranch, path)
        if (res.status === 'OK' && res.original && res.fixedCode) {
          const original = res.original, fixedCode = res.fixedCode
          setRepoFixes((prev) => ({ ...prev, [path]: { original, fixedCode } }))
        } else if (res.status === 'AI_OFF') {
          setRepoFixMsg(res.message || 'AI auto-fix is unavailable right now.')
          break
        } else {
          setRepoFixMsg(res.message || `Could not fix ${path}.`)
        }
      } catch {
        setRepoFixMsg("Couldn't reach the fixer for some files. Please try again.")
      }
    }
    setFixingPath(null); setFixingAll(false)
  }

  function acceptFix(path: string) {
    setAccepted((prev) => ({ ...prev, [path]: true }))
  }

  function downloadAccepted() {
    const files = Object.entries(repoFixes)
      .filter(([path]) => accepted[path])
      .map(([path, v]) => ({ path, content: v.fixedCode }))
    if (files.length === 0) return
    triggerDownload(makeZip(files), 'springguard-fixes.zip')
  }

  function reportTarget(r: ScanReport): string {
    return reportMode === 'repo' ? (r.target || 'repository') : 'Pasted code'
  }

  function buildReportMarkdown(r: ScanReport): string {
    const target = reportTarget(r)
    const date = new Date().toLocaleString()
    const lines: string[] = []
    lines.push('# SpringGuard Security Report')
    lines.push('')
    lines.push(`**Target:** ${target}`)
    lines.push(`**Grade:** ${r.grade} (score ${r.score}/100)`)
    if (reportMode === 'repo' && typeof r.filesScanned === 'number') {
      lines.push(`**Files scanned:** ${r.filesScanned}`)
    }
    lines.push(`**Generated:** ${date}`)
    lines.push('')
    lines.push(`> ${r.summary}`)
    lines.push('')
    lines.push(`## Findings (${r.findings.length})`)
    lines.push('')
    if (r.findings.length === 0) {
      lines.push('No known issues found.')
    } else {
      r.findings.forEach((f, i) => {
        const ai = f.source === 'AI' ? ' · AI review' : ''
        lines.push(`### ${i + 1}. [${f.severity}] ${f.title}${ai}`)
        if (f.file) lines.push(`**File:** \`${f.file}\``)
        lines.push('')
        lines.push(`**Why:** ${f.why}`)
        lines.push('')
        lines.push(`**Fix:** ${f.fix}`)
        lines.push('')
        lines.push('---')
        lines.push('')
      })
    }
    lines.push('_Generated by SpringGuard — rule-based + AI security review for Spring Boot._')
    return lines.join('\n')
  }

  function buildReportText(r: ScanReport): string {
    const target = reportTarget(r)
    const date = new Date().toLocaleString()
    const nl = '\r\n'
    const out: string[] = []
    out.push('SPRINGGUARD SECURITY REPORT')
    out.push('===========================')
    out.push('')
    out.push('Target:        ' + target)
    out.push('Grade:         ' + r.grade + ' (score ' + r.score + '/100)')
    if (reportMode === 'repo' && typeof r.filesScanned === 'number') {
      out.push('Files scanned: ' + r.filesScanned)
    }
    out.push('Generated:     ' + date)
    out.push('')
    out.push('Summary:')
    out.push('  ' + r.summary)
    out.push('')
    out.push('FINDINGS (' + r.findings.length + ')')
    out.push('------------')
    out.push('')
    if (r.findings.length === 0) {
      out.push('No known issues found.')
    } else {
      r.findings.forEach((f, i) => {
        const ai = f.source === 'AI' ? '  (AI review)' : ''
        out.push((i + 1) + '. [' + f.severity + '] ' + f.title + ai)
        if (f.file) out.push('   File: ' + f.file)
        out.push('   Why:  ' + f.why)
        out.push('   Fix:  ' + f.fix)
        out.push('')
      })
    }
    out.push('---')
    out.push('Generated by SpringGuard — rule-based + AI security review for Spring Boot.')
    return out.join(nl)
  }

  function baseName(): string {
    const slug = (reportMode === 'repo' && report && report.target ? report.target.replace(/[^a-zA-Z0-9]+/g, '-') : 'scan')
    const stamp = new Date().toISOString().slice(0, 10)
    return `springguard-${slug}-${stamp}`
  }

  function triggerDownload(content: string | Blob, filename: string, mime?: string) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function downloadMd() {
    if (!report || !analyzed) return
    triggerDownload(buildReportMarkdown(report), baseName() + '.md', 'text/markdown')
  }

  function downloadTxt() {
    if (!report || !analyzed) return
    triggerDownload(buildReportText(report), baseName() + '.txt', 'text/plain')
  }

  const showLanding = !email && !guest
  if (showLanding) {
    return <Landing onAuth={onAuth} onGuest={() => setGuest(true)} />
  }

  const repoFiles: string[] =
    report && reportMode === 'repo'
      ? Array.from(new Set(report.findings.map((f) => f.file).filter((x): x is string => !!x)))
      : []
  const acceptedCount = Object.values(accepted).filter(Boolean).length

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="shield"><ShieldIcon size={20} /></span>
          <span className="brand-name">SpringGuard</span>
        </div>
        <span className="brand-tag">A security grade for your Spring Boot app</span>
        <div className="authbar">
          {email ? (
            <>
              <span className="authwho">{email}</span>
              <button className="linkbtn" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <button className="linkbtn" onClick={() => setGuest(false)}>
              Sign in
            </button>
          )}
        </div>
      </header>


      <main className="main">
        <section className="inputcard">
          <div className="modetabs">
            <button className={mode === 'code' ? 'on' : ''} onClick={() => setMode('code')}>Paste code</button>
            <button className={mode === 'repo' ? 'on' : ''} onClick={() => setMode('repo')}>GitHub repo</button>
          </div>

          {mode === 'code' ? (
            <>
              <textarea
                className="editor" value={code} spellCheck={false}
                onChange={(e) => setCode(e.target.value)} aria-label="Spring Boot code to scan"
              />
              <button className="scan-btn" onClick={runScan} disabled={loading || !code.trim()}>
                {loading ? 'Scanning\u2026' : 'Scan for vulnerabilities'}
              </button>
              <p className="hint">Fix an issue, then scan again to watch the grade climb.</p>
            </>
          ) : (
            <>
              <input
                className="repo-input" placeholder="https://github.com/owner/repo"
                value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
              />
              <input
                className="repo-input" placeholder="Branch (optional — leave blank for default)"
                value={repoBranch} onChange={(e) => setRepoBranch(e.target.value)}
              />
              <input
                className="repo-input" type="password" placeholder="GitHub token (only for private repos)"
                value={repoToken} onChange={(e) => setRepoToken(e.target.value)}
              />
              <button className="scan-btn" onClick={runRepoScan} disabled={loading || !repoUrl.trim()}>
                {loading ? 'Scanning repository\u2026' : 'Scan repository'}
              </button>
              <p className="hint">Public repos need no token. A token is used only for this scan and never stored.</p>
            </>
          )}
        </section>

        <section className="results">
          <div className="pane-label">Report</div>

          {!report && !error && !loading && (
            <div className="empty"><p>Run a scan to see the security grade and findings.</p></div>
          )}
          {loading && <SkeletonLoader mode={mode} />}
          {error && <div className="error">{error}</div>}
          {report && !analyzed && <div className="notice">{report.message}</div>}

          {analyzed && report && (
            <div className="report">
              <div className="scorecards">
                <div className="gradecard">
                  <div
                    className="grade-ring"
                    style={{
                      '--grade-color': GRADE_COLOR[report.grade] || 'var(--amber)',
                      '--grade-pct': (report.score / 100).toFixed(3),
                    } as React.CSSProperties}
                  >
                    <div className="grade" style={{ color: GRADE_COLOR[report.grade] || 'var(--amber)' }}>
                      {report.grade}
                    </div>
                  </div>
                  <div className="gradeinfo">
                    <div className="cardlabel">{reportMode === 'repo' ? 'Repo grade' : 'Rule grade'}</div>
                    <div className="score">Score <strong>{report.score}</strong><span>/100</span></div>
                    <div className="summary">{report.summary}</div>
                    {email ? (
                      <button className="savebtn" onClick={saveCurrent} disabled={saved}>
                        {saved ? 'Saved \u2713' : 'Save to history'}
                      </button>
                    ) : (
                      <button className="savebtn ghost" onClick={() => setGuest(false)}>
                        Sign in to save
                      </button>
                    )}
                    <button className="downloadbtn" onClick={downloadMd}>Download .md</button>
                    <button className="downloadbtn" onClick={downloadTxt}>Download .txt</button>
                    {saveMsg && <div className="autherror">{saveMsg}</div>}
                  </div>
                </div>

                {reportMode === 'code' && (
                  <div className="aicard">
                    <div className="ai-emblem">AI</div>
                    <div>
                      <div className="cardlabel ai">AI review</div>
                      <div className="ai-count">
                        {aiFindings.length === 0 ? 'No additional concerns' : `${aiFindings.length} concern${aiFindings.length === 1 ? '' : 's'} found`}
                      </div>
                      {aiFindings.length > 0 && (
                        <div className="ai-breakdown">{aiHigh} high · {aiMed} medium · {aiLow} low</div>
                      )}
                      <div className="ai-note">Advisory — doesn't change the grade. Deeper logic risks can persist after a fix, since they often need app-specific changes.</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="findings">
                {report.findings.length === 0 && (
                  <div className="clean">No known issues found. Nicely done.</div>
                )}
                {report.findings.map((f, i) => (
                  <article key={i} className={`finding sev-${f.severity.toLowerCase()}`}>
                    <header className="finding-head">
                      <span className="sev-badge">{SEV_LABEL[f.severity]}</span>
                      {f.source === 'AI' && <span className="ai-badge">AI review</span>}
                      <h3 className="finding-title">{f.title}</h3>
                    </header>
                    {f.file && <div className="file-tag">{f.file}</div>}
                    <p className="finding-why">{f.why}</p>
                    <p className="finding-fix"><span>Fix</span> {f.fix}</p>
                  </article>
                ))}
              </div>

              {reportMode === 'code' && report.findings.length > 0 && (
                <div className="fixpanel">
                  <FixPanelHeader
                    subtitle="Let AI rewrite this file with the issues fixed, then review the diff."
                    action={
                      <button className="scan-btn fixbtn" onClick={runFix} disabled={fixing}>
                        {fixing ? 'Fixing…' : 'Fix with AI'}
                      </button>
                    }
                  />
                  <ResolvingChips findings={report.findings} />
                  {fixMsg && <div className="notice">{fixMsg}</div>}
                  {fixedCode && (
                    <>
                      <DiffView original={code} fixed={fixedCode} />
                      <div className="fixactions">
                        <button className="savebtn" onClick={applyFix}>Apply fix to editor</button>
                        <button className="downloadbtn" onClick={() => navigator.clipboard.writeText(fixedCode)}>Copy fixed code</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {reportMode === 'repo' && repoFiles.length > 0 && (
                <div className="fixpanel">
                  <FixPanelHeader
                    subtitle="Generate AI fixes for the flagged files, review each diff, then accept the ones you want and download them."
                    action={
                      Object.keys(repoFixes).length === 0 ? (
                        <button className="scan-btn fixbtn" onClick={() => fixAllRepoFiles(repoFiles)} disabled={fixingAll}>
                          {fixingAll ? 'Fixing…' : 'Fix with AI'}
                        </button>
                      ) : (
                        acceptedCount > 0 && (
                          <button className="scan-btn fixbtn" onClick={downloadAccepted}>
                            Download accepted ({acceptedCount}) as ZIP
                          </button>
                        )
                      )
                    }
                  />
                  {repoFixMsg && <div className="notice">{repoFixMsg}</div>}
                  <div className="fixfiles">
                    {repoFiles.map((path) => (
                      <div key={path} className="fixfile">
                        <div className="fixfile-row">
                          <span className="fixfile-path">{path}</span>
                          {accepted[path] ? (
                            <span className="fixfile-done">Accepted ✓</span>
                          ) : repoFixes[path] ? (
                            <button className="savebtn accept" onClick={() => acceptFix(path)}>Accept changes</button>
                          ) : fixingPath === path ? (
                            <span className="fixfile-pending">Fixing…</span>
                          ) : fixingAll ? (
                            <span className="fixfile-pending">Queued…</span>
                          ) : null}
                        </div>
                        <ResolvingChips findings={report.findings.filter((f) => f.file === path)} />
                        {repoFixes[path] && (
                          <DiffView original={repoFixes[path].original} fixed={repoFixes[path].fixedCode} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {email && (
        <section className="historysection">
          <div className="pane-label">Your scan history</div>
          <HistoryPanel items={history} onDelete={handleDelete} />
        </section>
      )}

      <footer className="foot">SpringGuard · Java · Spring Boot</footer>
    </div>
  )
}
