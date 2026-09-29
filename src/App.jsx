import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { DEFAULTS } from './lib/defaults'
import { useAuth } from './lib/useAuth'
import Syndicate from './components/Syndicate'
import Team from './components/Team'
import Social from './components/Social'
import Media from './components/Media'
import Analyser from './components/Analyser'
import Login from './components/Login'

const TABS = [
  ['/', 'Syndicate'],
  ['/team', 'Team'],
  ['/social', 'Social'],
  ['/media', 'Media'],
  ['/analyser', 'Player Analyser'],
  ['/admin', 'Admin'],
]

export default function App() {
  const auth = useAuth()
  const { pathname } = useLocation()
  const [site, setSite] = useState(DEFAULTS)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    supabase
      .from('site')
      .select('data')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.data && Object.keys(data.data).length) setSite({ ...DEFAULTS, ...data.data })
      })
  }, [])

  const set = (patch) => {
    setSite((s) => ({ ...s, ...patch }))
    setDirty(true)
  }

  async function save() {
    setStatus('Saving…')
    const { error } = await supabase.from('site').upsert({ id: 1, data: site })
    setStatus(error ? `Save failed: ${error.message}` : 'Saved ✓')
    if (!error) setDirty(false)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const admin = auth.isAdmin
  const shared = { site, set, admin }

  return (
    <div className="app">
      <header>
        <span className="brand">{site.name}</span>
        <nav>
          {TABS.map(([to, label]) => (
            <NavLink key={to} to={to} end className={({ isActive }) => (isActive ? 'on' : '')}>
              {to === '/admin' && admin ? 'Admin ✓' : label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Syndicate {...shared} />} />
          <Route path="/team" element={<Team admin={admin} />} />
          <Route path="/social" element={<Social {...shared} />} />
          <Route path="/media" element={<Media admin={admin} />} />
          <Route path="/analyser" element={<Analyser />} />
          <Route path="/admin" element={<Login auth={auth} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {admin && (
        <div className="savebar">
          <span>{status}</span>
          <button onClick={save} disabled={!dirty}>Save changes</button>
        </div>
      )}
    </div>
  )
}
