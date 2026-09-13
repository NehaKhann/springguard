import { useState } from 'react'
import AuthPanel from './AuthPanel'
import ShieldIcon from './ShieldIcon'
import type { AuthResponse } from './types'

const COMPARISON = [
  { feature: 'Spring Boot-specific rules', guard: true, manual: '—', sast: 'Partial' },
  { feature: 'Instant scan (no setup)', guard: true, manual: '—', sast: '—' },
  { feature: 'AI logic-flaw detection', guard: true, manual: '—', sast: '—' },
  { feature: 'Auto-fix with diff review', guard: true, manual: '—', sast: '—' },
  { feature: 'GitHub repo scanning', guard: true, manual: '—', sast: true },
  { feature: 'Plain-language explanations', guard: true, manual: true, sast: '—' },
  { feature: 'Cost per scan', guard: 'Free', manual: '$200–500/hr', sast: '$12K+/yr' },
  { feature: 'False-positive rate', guard: 'Low', manual: '—', sast: 'High' },
]

const FAQS = [
  {
    q: 'How does SpringGuard grade my code?',
    a: '21 deterministic rules scan for known Spring Boot vulnerabilities (CSRF, CORS, hardcoded secrets, actuator exposure, JWT misconfiguration, etc.). Each issue reduces your score. The final grade maps to an A–F scale.',
  },
  {
    q: 'What does the AI review catch that rules miss?',
    a: 'Rules match patterns. AI reads the code semantically — it can detect Insecure Direct Object References, broken access control, improper error handling, and other context-dependent flaws that no regex can find.',
  },
  {
    q: 'Is my code sent to a third party?',
    a: 'Code is sent to the configured AI provider (default: Groq with Llama 3.3) for AI review and auto-fix. Rule-based scanning runs entirely server-side. We do not store pasted code or repo contents after the scan.',
  },
  {
    q: 'Can I scan private repositories?',
    a: 'Yes. Provide a GitHub token with repo access when scanning. The token is used only for the scan request and is never stored on our servers.',
  },
]

function ComparisonTable() {
  return (
    <div className="comparison-wrap">
      <table className="comparison">
        <thead>
          <tr>
            <th>Feature</th>
            <th className="col-guard">SpringGuard</th>
            <th>Manual review</th>
            <th>Traditional SAST</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row, i) => (
            <tr key={i}>
              <td className="comp-feat">{row.feature}</td>
              <td className="col-guard">{row.guard === true ? <span className="check">&check;</span> : row.guard}</td>
              <td>{row.manual === true ? <span className="check dim">&check;</span> : row.manual}</td>
              <td>{row.sast === true ? <span className="check dim">&check;</span> : row.sast}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item${open ? ' faq-open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        {q}
        <span className="faq-chevron">{open ? '\u2212' : '+'}</span>
      </button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  )
}

export default function Landing({
  onAuth,
  onGuest,
}: {
  onAuth: (res: AuthResponse) => void
  onGuest: () => void
}) {
  return (
    <div className="landing">
      <div className="landing-top">
        <div className="landing-inner">
          <section className="landing-hero">
            <div className="brand">
              <span className="shield"><ShieldIcon size={18} /></span>
              <span className="brand-name">SpringGuard</span>
            </div>
            <h1 className="landing-title">
              Know your Spring Boot app's security grade.
            </h1>
            <p className="landing-sub">
              21 deterministic rules scan for CSRF, CORS, hardcoded secrets, actuator leaks, and more.
              Then an AI review catches the logic flaws that rules can't see.
              Paste code or scan a GitHub repo — get an <strong>A–F grade</strong> in seconds.
            </p>
            <ul className="landing-points">
              <li><span className="chip">21</span> Spring Boot-specific security rules</li>
              <li><span className="chip">AI</span> review for IDOR, ACL, and logic flaws</li>
              <li><span className="chip">fix</span> AI auto-fix with before/after diff</li>
              <li><span className="chip">repo</span> GitHub repo scan (public or private)</li>
            </ul>
          </section>

          <section className="landing-auth">
            <div className="landing-auth-head">Start your free scan</div>
            <AuthPanel onAuth={onAuth} />
            <button className="guestlink" onClick={onGuest}>
              Continue without signing in &rarr;
            </button>
            <p className="landing-fineprint">
              An account lets you save scans and revisit them later. You can sign in anytime.
            </p>
          </section>
        </div>
      </div>

      <section className="landing-section">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <h3 className="step-title">Paste code or a repo URL</h3>
            <p className="step-desc">Drop a Spring Boot file or point to a GitHub repository. No sign-up needed to start.</p>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <h3 className="step-title">Get your grade + findings</h3>
            <p className="step-desc">An A–F grade with score, every issue explained in plain language, and severity labels.</p>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="step-title">Fix with AI (optional)</h3>
            <p className="step-desc">Let AI rewrite flagged files, review the diff, and download accepted fixes as a ZIP.</p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <h2 className="section-title">SpringGuard vs the alternatives</h2>
        <p className="section-sub">
          Manual reviews are slow and expensive. Traditional SAST tools blast you with false positives and miss Spring-specific issues.
          SpringGuard is built <em>only</em> for Spring Boot — so it catches what matters and speaks your language.
        </p>
        <ComparisonTable />
      </section>

      <section className="landing-section landing-section-alt">
        <h2 className="section-title">Frequently asked questions</h2>
        <div className="faq-list">
          {FAQS.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      <section className="landing-section landing-cta">
        <h2 className="section-title">Ready to secure your Spring Boot app?</h2>
        <p className="section-sub">No credit card. No setup. Just paste code and get your security grade.</p>
        <div className="landing-cta-auth">
          <AuthPanel onAuth={onAuth} />
          <button className="guestlink" onClick={onGuest}>
            Continue without signing in &rarr;
          </button>
        </div>
      </section>

      <footer className="landing-foot">
        <div className="landing-foot-inner">
          <div className="landing-foot-brand">
            <span className="shield"><ShieldIcon size={18} /></span>
            <span className="brand-name">SpringGuard</span>
          </div>
          <span className="landing-foot-copy">Security scanner for Spring Boot &middot; Java &middot; OSS</span>
        </div>
      </footer>
    </div>
  )
}
