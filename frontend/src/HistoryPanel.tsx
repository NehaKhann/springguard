import { useState } from 'react'
import type { ScanRecordResponse, Severity } from './types'

const GRADE_COLOR: Record<string, string> = {
  A: 'var(--green)', B: 'var(--green)', C: 'var(--amber)', D: 'var(--orange)', F: 'var(--red)',
}
const SEV_LABEL: Record<Severity, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }

export default function HistoryPanel({
  items,
  onDelete,
}: {
  items: ScanRecordResponse[]
  onDelete: (id: number) => void
}) {
  const [open, setOpen] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)

  if (items.length === 0) {
    return <div className="empty"><p>No saved scans yet. Run a scan and save it to build your history.</p></div>
  }

  function confirmDelete(id: number) {
    onDelete(id)
    setPendingDelete(null)
  }

  return (
    <div className="history">
      {items.map((it) => {
        const isOpen = open === it.id
        const count = it.findings?.length ?? 0
        const isPending = pendingDelete === it.id
        return (
          <div key={it.id} className="histcard">
            <div className="histrow">
              <button className="histmain" onClick={() => { setPendingDelete(null); setOpen(isOpen ? null : it.id) }}>
                <span className="histgrade" style={{ color: GRADE_COLOR[it.grade] || 'var(--amber)' }}>{it.grade}</span>
                <span className="histbody">
                  <span className="histsummary">{it.summary || `Score ${it.score}/100`}</span>
                  <span className="histdate">{new Date(it.createdAt).toLocaleString()}</span>
                </span>
                <span className="histscore">{it.score}</span>
                <span className="histchevron">{count > 0 ? (isOpen ? '\u2212' : '+') : ''}</span>
              </button>
              {isPending ? (
                <div className="histdelete-wrap">
                  <span className="histdelete-label">Delete?</span>
                  <button className="histconfirm" onClick={() => confirmDelete(it.id)}>Yes, delete</button>
                  <button className="histcancel" onClick={() => setPendingDelete(null)}>Cancel</button>
                </div>
              ) : (
                <button className="histdelete" title="Delete this scan" onClick={() => setPendingDelete(it.id)}>
                  {'\u2715'}
                </button>
              )}
            </div>

            {isOpen && count > 0 && (
              <div className="histfindings">
                {it.findings.map((f, i) => (
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
            )}
          </div>
        )
      })}
    </div>
  )
}
