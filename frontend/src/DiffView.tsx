type Row = { type: 'same' | 'add' | 'del'; text: string }

function diffLines(a: string[], b: string[]): Row[] {
  const n = a.length, m = b.length
  // LCS length table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const rows: Row[] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { rows.push({ type: 'same', text: a[i] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { rows.push({ type: 'del', text: a[i] }); i++ }
    else { rows.push({ type: 'add', text: b[j] }); j++ }
  }
  while (i < n) { rows.push({ type: 'del', text: a[i++] }) }
  while (j < m) { rows.push({ type: 'add', text: b[j++] }) }
  return rows
}

export default function DiffView({ original, fixed }: { original: string; fixed: string }) {
  const rows = diffLines(original.split('\n'), fixed.split('\n'))
  const added = rows.filter((r) => r.type === 'add').length
  const removed = rows.filter((r) => r.type === 'del').length

  return (
    <div className="diff">
      <div className="diff-stats">
        <span className="diff-add">+{added}</span>
        <span className="diff-del">-{removed}</span>
        <span className="diff-meta">lines changed</span>
      </div>
      <pre className="diff-body">
        {rows.map((r, idx) => (
          <div key={idx} className={`diff-row diff-${r.type}`}>
            <span className="diff-sign">{r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' '}</span>
            <span className="diff-text">{r.text || ' '}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}
