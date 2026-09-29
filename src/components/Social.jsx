import { EditText } from './Editable'

export default function Social({ site, set, admin }) {
  const upd = (i, patch) => set({ socials: site.socials.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
  return (
    <section className="stack">
      <h2>Find us online</h2>
      {site.socials.map((s, i) => (
        <div className="card row" key={i}>
          <strong><EditText admin={admin} value={s.label} onChange={(v) => upd(i, { label: v })} /></strong>
          {admin ? (
            <input className="edit" value={s.url} onChange={(e) => upd(i, { url: e.target.value })} />
          ) : (
            <a href={s.url} target="_blank" rel="noreferrer">{s.url}</a>
          )}
          {admin && <button className="x" onClick={() => set({ socials: site.socials.filter((_, j) => j !== i) })}>✕</button>}
        </div>
      ))}
      {admin && <button className="ghost" onClick={() => set({ socials: [...site.socials, { label: 'New link', url: 'https://' }] })}>+ Add link</button>}
    </section>
  )
}
