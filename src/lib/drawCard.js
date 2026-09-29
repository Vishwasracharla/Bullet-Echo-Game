const TIER_COLOR = { Excellent: '#3ddc84', Good: '#8bd450', Medium: '#f5b53d', Weak: '#ef5b5b' }

export function tierFor(rating) {
  if (rating >= 8) return 'Excellent'
  if (rating >= 6) return 'Good'
  if (rating >= 4) return 'Medium'
  return 'Weak'
}

// Normalise whatever the function returns into { players: [...], verdict }.
export function normalise(raw) {
  const list = Array.isArray(raw.players) ? raw.players : raw.player || raw.stats ? [raw] : []
  const players = list.map((p) => {
    const rating = Math.max(0, Math.min(10, Number(p.rating) || 0))
    const stats = Array.isArray(p.stats)
      ? p.stats.map((s) => ({ k: String(s.k ?? s.label ?? ''), v: String(s.v ?? s.value ?? '') }))
      : Object.entries(p.stats || {}).map(([k, v]) => ({ k, v: String(v) }))
    const first = (x) => (Array.isArray(x) ? x[0] : x) || ''
    return {
      name: p.name || p.player || 'Unknown',
      rating,
      tier: p.tier || tierFor(rating),
      stats,
      strength: first(p.strength ?? p.strengths),
      weakness: first(p.weakness ?? p.weaknesses),
    }
  })
  return { players, verdict: raw.verdict || raw.summary || '' }
}

function wrap(ctx, text, x, y, maxW, lh) {
  let line = ''
  let yy = y
  for (const w of String(text).split(' ')) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line, x, yy)
      line = w
      yy += lh
    } else line = t
  }
  if (line) ctx.fillText(line, x, yy)
  return yy + lh
}

export function drawCard(canvas, { players, verdict }) {
  const W = 1200
  const rowH = 250
  const H = 170 + players.length * rowH + 150
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0d0f14'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#e8b04a'
  ctx.fillRect(0, 0, W, 8)
  ctx.fillStyle = '#fff'
  ctx.font = '700 44px system-ui, sans-serif'
  ctx.fillText('BAAROOD · Player Analysis', 40, 76)
  ctx.fillStyle = '#8b93a5'
  ctx.font = '22px system-ui, sans-serif'
  ctx.fillText('Bullet Echo · generated from submitted screenshots', 40, 116)

  players.forEach((p, i) => {
    const y = 150 + i * rowH
    const col = TIER_COLOR[p.tier] || '#aaa'
    ctx.fillStyle = '#171a22'
    ctx.beginPath()
    ctx.roundRect(30, y, W - 60, rowH - 20, 16)
    ctx.fill()
    ctx.fillStyle = col
    ctx.fillRect(30, y, 8, rowH - 20)
    ctx.fillStyle = '#fff'
    ctx.font = '700 34px system-ui, sans-serif'
    ctx.fillText(p.name, 62, y + 50)
    ctx.fillStyle = col
    ctx.font = '700 28px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${p.tier} · ${p.rating.toFixed(1)}/10`, W - 60, y + 50)
    ctx.textAlign = 'left'
    // rating bar
    ctx.fillStyle = '#262b38'
    ctx.fillRect(62, y + 68, W - 152, 10)
    ctx.fillStyle = col
    ctx.fillRect(62, y + 68, ((W - 152) * p.rating) / 10, 10)
    // stats
    ctx.font = '20px system-ui, sans-serif'
    p.stats.slice(0, 8).forEach((s, j) => {
      const cx = 62 + (j % 4) * 275
      const cy = y + 115 + Math.floor(j / 4) * 30
      ctx.fillStyle = '#8b93a5'
      ctx.fillText(s.k, cx, cy)
      ctx.fillStyle = '#fff'
      ctx.fillText(s.v, cx + ctx.measureText(`${s.k} `).width + 4, cy)
    })
    ctx.font = '19px system-ui, sans-serif'
    ctx.fillStyle = '#3ddc84'
    ctx.fillText(`+ ${p.strength}`.slice(0, 95), 62, y + 190)
    ctx.fillStyle = '#ef5b5b'
    ctx.fillText(`− ${p.weakness}`.slice(0, 95), 62, y + 218)
  })

  const vy = 150 + players.length * rowH
  ctx.fillStyle = '#e8b04a'
  ctx.font = '700 26px system-ui, sans-serif'
  ctx.fillText('Verdict', 40, vy + 30)
  ctx.fillStyle = '#e8eaf0'
  ctx.font = '22px system-ui, sans-serif'
  wrap(ctx, verdict, 40, vy + 66, W - 80, 30)
}
