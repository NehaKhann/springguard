export type Severity = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Finding {
  id: string
  severity: Severity
  title: string
  why: string
  fix: string
  source?: 'RULE' | 'AI'
  file?: string | null
}

export interface ScanReport {
  score: number
  grade: string
  summary: string
  findings: Finding[]
  status: 'ANALYZED' | 'EMPTY' | 'NOT_SPRING' | 'TOO_LARGE' | 'BAD_URL' | 'NO_FILES' | 'BRANCH_NOT_FOUND' | 'ERROR'
  message: string | null
  filesScanned?: number
  target?: string | null
}

export interface AuthResponse {
  token: string
  email: string
}

export interface ScanRecordResponse {
  id: number
  grade: string
  score: number
  summary: string
  createdAt: string
  findings: Finding[]
}

export interface FixResponse {
  status: 'OK' | 'AI_OFF' | 'ERROR'
  message: string | null
  fixedCode: string | null
}

export interface RepoFileFixResponse {
  status: 'OK' | 'AI_OFF' | 'ERROR'
  message: string | null
  path: string
  original: string | null
  fixedCode: string | null
}
