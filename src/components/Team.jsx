import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROLES = ['Leader', 'Owner', 'Co-leader', 'Elder', 'Member']

// Team members live in the `team_members` table. Everyone can read; only admins can write.
export default function Team({ admin }) {
  const [people, setPeople] = useState([])
  const [msg, setMsg] = useState('')
  const [draft, setDraft] = useState({ name: '', role: 'Member' })

  async function load() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('position')
      .order('created_at')
    if (error) setMsg(error.message)
    else setPeople(data)
  }
  useEffect(() => {
    load()
  }, [])

  const local = (id, patch) => setPeople((xs) => xs.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  async function save(id, patch) {
    const { error } = await supabase.from('team_members').update(patch).eq('id', id)
    setMsg(error ? error.message : '')
  }

  async function add(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    const position = people.length ? Math.max(...people.map((p) => p.position || 0)) + 1 : 0
    const { data, error } = await supabase
      .from('team_members')
      .insert({ name: draft.name.trim(), role: draft.role, position })
      .select()
      .single()
    if (error) return setMsg(error.message)
    setPeople((xs) => [...xs, data])
    setDraft({ name: '', role: 'Member' })
    setMsg('')
  }

  async function remove(p) {
    if (!confirm(`Remove ${p.name}?`)) return
    const { error } = await supabase.from('team_members').delete().eq('id', p.id)
    if (error) setMsg(error.message)
    else setPeople((xs) => xs.filter((x) => x.id !== p.id))
  }

  return (
    <section className="stack">
      <h2>Team</h2>
      {msg && <p className="msg">{msg}</p>}
      <div className="grid3">
        {people.map((p) => (
          <div className={`card person ${p.role === 'Leader' ? 'lead' : ''}`} key={p.id}>
            <div className="avatar">{(p.name || '?')[0]}</div>
            {admin ? (
              <>
                <input
                  className="edit"
                  value={p.name}
                  onChange={(e) => local(p.id, { name: e.target.value })}
                  onBlur={(e) => save(p.id, { name: e.target.value })}
                />
                <select
                  className="edit"
                  value={p.role}
                  onChange={(e) => {
                    local(p.id, { role: e.target.value })
                    save(p.id, { role: e.target.value })
                  }}
                >
                  {[...new Set([...ROLES, p.role])].map((r) => <option key={r}>{r}</option>)}
                </select>
                <button className="x" onClick={() => remove(p)}>Remove</button>
              </>
            ) : (
              <>
                <h3>{p.name}</h3>
                <span className="tag">{p.role}</span>
              </>
            )}
          </div>
        ))}
        {!people.length && <p className="muted">No team members yet.</p>}
      </div>
      {admin && (
        <form className="card row wrap" onSubmit={add}>
          <input
            className="edit grow"
            placeholder="New person's name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <select className="edit" style={{ width: 'auto' }} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button>+ Add person</button>
        </form>
      )}
    </section>
  )
}
