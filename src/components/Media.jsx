import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/image'

const MAX_MB = 50 // Supabase free plan per-file cap
const publicUrl = (path) => supabase.storage.from('media').getPublicUrl(path).data.publicUrl
const kindOf = (type) => (type.startsWith('image/') ? 'image' : type.startsWith('video/') ? 'video' : 'file')
const size = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`)

export default function Media({ admin }) {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .in('kind', ['image', 'video', 'file'])
      .order('created_at', { ascending: false })
    if (error) setMsg(error.message)
    else setItems(data)
  }
  useEffect(() => {
    load()
  }, [])

  async function upload(e) {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setMsg('')
    const errors = []
    for (const f of files) {
      try {
        setBusy(`Uploading ${f.name}…`)
        const kind = kindOf(f.type)
        let body = f
        let type = f.type || 'application/octet-stream'
        let ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
        if (kind === 'image' && !/gif|svg/.test(f.type)) {
          body = await compressImage(f)
          type = 'image/jpeg'
          ext = 'jpg'
        }
        if (body.size > MAX_MB * 1e6) throw new Error(`too big (max ${MAX_MB} MB)`)
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const up = await supabase.storage.from('media').upload(path, body, { contentType: type })
        if (up.error) throw up.error
        const ins = await supabase.from('media').insert({ title: f.name, path, kind })
        if (ins.error) {
          await supabase.storage.from('media').remove([path])
          throw ins.error
        }
      } catch (err) {
        errors.push(`${f.name}: ${err.message || err}`)
      }
    }
    setBusy('')
    if (errors.length) setMsg(errors.join('\n'))
    load()
  }

  async function remove(m) {
    if (!confirm(`Delete "${m.title}"?`)) return
    await supabase.storage.from('media').remove([m.path])
    const { error } = await supabase.from('media').delete().eq('id', m.id)
    if (error) setMsg(error.message)
    else setItems((xs) => xs.filter((x) => x.id !== m.id))
  }

  return (
    <section className="stack">
      <h2>Media</h2>
      <p className="muted">Anyone can upload images, videos and files (up to {MAX_MB} MB each). Only admins can delete.</p>
      <div className="card row wrap">
        <label className="btn">
          {busy ? 'Uploading…' : 'Upload files'}
          <input type="file" multiple hidden onChange={upload} disabled={!!busy} />
        </label>
        {busy && <span className="muted">{busy}</span>}
      </div>
      {msg && <p className="msg pre">{msg}</p>}
      <div className="gallery">
        {items.map((m) => (
          <figure className="card tile" key={m.id}>
            {m.kind === 'image' && (
              <a href={publicUrl(m.path)} target="_blank" rel="noreferrer">
                <img src={publicUrl(m.path)} alt={m.title} loading="lazy" />
              </a>
            )}
            {m.kind === 'video' && <video src={publicUrl(m.path)} controls preload="metadata" />}
            {m.kind === 'file' && (
              <a className="filebox" href={publicUrl(m.path)} download={m.title} target="_blank" rel="noreferrer">
                <span>📄</span>
                <strong>{m.title}</strong>
                <small>Download</small>
              </a>
            )}
            <figcaption className="muted">{m.title}</figcaption>
            {admin && <button className="x" onClick={() => remove(m)}>Delete</button>}
          </figure>
        ))}
        {!items.length && <p className="muted">Nothing here yet.</p>}
      </div>
    </section>
  )
}
