import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage, blobToBase64 } from '../lib/image'
import { normalise } from '../lib/drawCard'

const TIER_CLASS = { Excellent: 'good', Good: 'good', Medium: 'mid', Weak: 'bad' }

function toText(r) {
  const lines = r.players.map(
    (p) =>
      `${p.name} — ${p.tier} (${p.rating.toFixed(1)}/10)\n` +
      p.stats.map((s) => `  ${s.k}: ${s.v}`).join('\n') +
      `\n  + ${p.strength}\n  - ${p.weakness}`
  )
  return `${r.title ? r.title + '\n\n' : ''}${lines.join('\n\n')}\n\nVerdict: ${r.verdict}`
}

export default function Analyser() {
  const [files, setFiles] = useState([])
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const [previews, setPreviews] = useState([])
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach(URL.revokeObjectURL)
  }, [files])

  async function analyse() {
    setBusy(true)
    setErr('')
    setResult(null)
    try {
      const images = []
      for (const f of files.slice(0, 6)) {
        const b = await compressImage(f, 1400, 0.8)
        images.push({ mime: 'image/jpeg', data: await blobToBase64(b) })
      }
      const { data, error } = await supabase.functions.invoke('analyse', { body: { images, focus: prompt } })
      if (error) {
        let detail = error.message
        try {
          const j = await error.context.json()
          detail = j.error || JSON.stringify(j)
        } catch {
          /* keep default message */
        }
        throw new Error(detail)
      }
      const out = normalise(data || {})
      out.title = data?.title || ''
      if (!out.players.length) throw new Error('The AI returned no player data. Try clearer screenshots.')
      setResult(out)
    } catch (e) {
      setErr(e.message || String(e))
    }
    setBusy(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(toText(result))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="stack">
      <h2>Syndicate &amp; Player Analyser</h2>
      <p className="muted">Upload one or more stat screenshots and get a written analysis of each player.</p>
      <div className="card stack">
        <label className="btn">
          Choose screenshots
          <input type="file" accept="image/*" multiple hidden onChange={(e) => setFiles([...e.target.files].slice(0, 6))} />
        </label>
        {!!files.length && (
          <div className="thumbs">
            {previews.map((u, i) => <img key={i} src={u} alt="" />)}
          </div>
        )}
        <textarea
          className="edit"
          rows={3}
          placeholder="Optional: e.g. compare all players, focus on KD and contribution"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button onClick={analyse} disabled={busy || !files.length}>{busy ? 'Analysing…' : 'Analyse'}</button>
      </div>
      {err && <p className="msg">{err}</p>}
      {result && (
        <div className="stack">
          {result.title && <h3>{result.title}</h3>}
          {result.players.map((p, i) => (
            <div className={`card player ${TIER_CLASS[p.tier] || ''}`} key={i}>
              <div className="row">
                <strong className="grow">{p.name}</strong>
                <span className="tag">{p.tier} · {p.rating.toFixed(1)}/10</span>
              </div>
              <div className="bar"><i style={{ width: `${p.rating * 10}%` }} /></div>
              <div className="stats">
                {p.stats.map((s, j) => (
                  <span key={j}><span className="muted">{s.k}</span> {s.v}</span>
                ))}
              </div>
              <p className="pos">+ {p.strength}</p>
              <p className="neg">− {p.weakness}</p>
            </div>
          ))}
          {result.verdict && (
            <div className="card">
              <h3>Verdict</h3>
              <p>{result.verdict}</p>
            </div>
          )}
          <button onClick={copy}>{copied ? 'Copied ✓' : 'Copy analysis as text'}</button>
        </div>
      )}
    </section>
  )
}
