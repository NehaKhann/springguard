import { useState } from 'react'
import { registerUser, loginUser } from './api'
import type { AuthResponse } from './types'

export default function AuthPanel({ onAuth }: { onAuth: (res: AuthResponse) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = mode === 'login'
        ? await loginUser(email, password)
        : await registerUser(email, password)
      onAuth(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="authpanel">
      <div className="authtabs">
        <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Sign in</button>
        <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Create account</button>
      </div>
      <input
        className="authinput" type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="authinput" type="password" placeholder="Password (min 6 characters)" value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {error && <div className="autherror">{error}</div>}
      <button className="authsubmit" onClick={submit} disabled={busy || !email || !password}>
        {busy ? 'Please wait\u2026' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
    </div>
  )
}
