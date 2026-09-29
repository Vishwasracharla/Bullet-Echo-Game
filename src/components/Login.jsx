import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ auth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function login(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg(error.message)
    setBusy(false)
  }

  async function forgot() {
    if (!email) return setMsg('Enter your email first.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setMsg(error ? error.message : 'Reset email sent. Check your inbox.')
  }

  async function changePassword(e) {
    e.preventDefault()
    const pw = String(new FormData(e.target).get('pw'))
    if (pw.length < 8) return setMsg('Use at least 8 characters.')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setMsg(error ? error.message : 'Password updated.')
    e.target.reset()
  }

  if (auth.session) {
    return (
      <section className="stack narrow">
        <h2>Admin</h2>
        <div className="card">
          <p>Signed in as <strong>{auth.session.user.email}</strong></p>
          <p>{auth.isAdmin ? '✓ You have admin rights. Fields are editable on every tab.' : '✕ This account is not an admin. Add its user id to the admins table.'}</p>
          <button onClick={() => supabase.auth.signOut()}>Log out</button>
        </div>
        <form className="card" onSubmit={changePassword}>
          <h3>Change password</h3>
          <input name="pw" type="password" placeholder="New password" className="edit" />
          <button>Update</button>
        </form>
        {msg && <p className="msg">{msg}</p>}
      </section>
    )
  }

  return (
    <section className="stack narrow">
      <h2>Admin login</h2>
      <form className="card" onSubmit={login}>
        <input className="edit" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="edit" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
        <button type="button" className="ghost" onClick={forgot}>Forgot password</button>
      </form>
      {msg && <p className="msg">{msg}</p>}
    </section>
  )
}
