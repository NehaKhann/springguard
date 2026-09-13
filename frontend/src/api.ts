import type { ScanReport, AuthResponse, ScanRecordResponse, Finding, FixResponse, RepoFileFixResponse } from './types'

const base = (import.meta as any).env?.VITE_API_BASE ?? ''

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return (data && data.message) ? data.message : fallback
  } catch {
    return fallback
  }
}

export async function scanCode(code: string): Promise<ScanReport> {
  const res = await fetch(`${base}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error(`The scanner responded with ${res.status}.`)
  return res.json() as Promise<ScanReport>
}

export async function scanRepo(repoUrl: string, token?: string, branch?: string): Promise<ScanReport> {
  const res = await fetch(`${base}/api/scan-repo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, token: token ?? null, branch: branch ?? null }),
  })
  if (!res.ok) throw new Error(`The scanner responded with ${res.status}.`)
  return res.json() as Promise<ScanReport>
}

export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await readError(res, 'Could not create your account.'))
  return res.json() as Promise<AuthResponse>
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await readError(res, 'Could not sign you in.'))
  return res.json() as Promise<AuthResponse>
}

export async function saveScan(
  token: string,
  payload: { grade: string; score: number; summary: string; findings: Finding[] },
): Promise<ScanRecordResponse> {
  const res = await fetch(`${base}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readError(res, 'Could not save this scan.'))
  return res.json() as Promise<ScanRecordResponse>
}

export async function listScans(token: string): Promise<ScanRecordResponse[]> {
  const res = await fetch(`${base}/api/scans`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res, 'Could not load your history.'))
  return res.json() as Promise<ScanRecordResponse[]>
}

export async function deleteScan(token: string, id: number): Promise<void> {
  const res = await fetch(`${base}/api/scans/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res, 'Could not delete this scan.'))
}

export async function fixCode(code: string): Promise<FixResponse> {
  const res = await fetch(`${base}/api/fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error(`The fixer responded with ${res.status}.`)
  return res.json() as Promise<FixResponse>
}

export async function fixRepoFile(
  repoUrl: string, token: string, branch: string, path: string,
): Promise<RepoFileFixResponse> {
  const res = await fetch(`${base}/api/fix-repo-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, token, branch, path }),
  })
  if (!res.ok) throw new Error(`The fixer responded with ${res.status}.`)
  return res.json() as Promise<RepoFileFixResponse>
}
