import { EditText, EditList } from './Editable'

export default function Syndicate({ site, set, admin }) {
  const discord = site.socials.find((s) => /discord/i.test(s.label))
  return (
    <section className="stack">
      <video
        className="herovideo"
        src="/gemini_generated_video_8b1c6a1a.mp4"
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        preload="auto"
      />
      <div className="hero">
        <h1><EditText admin={admin} value={site.name} onChange={(v) => set({ name: v })} /></h1>
        <p className="muted"><EditText admin={admin} value={site.region} onChange={(v) => set({ region: v })} /></p>
        <blockquote><EditText admin={admin} value={site.quote} onChange={(v) => set({ quote: v })} /></blockquote>
      </div>
      <div className="card">
        <h2>Our story</h2>
        <EditText as="p" multiline admin={admin} value={site.story} onChange={(v) => set({ story: v })} />
      </div>
      <div className="grid2">
        <div className="card">
          <h2>Requirements</h2>
          <p className="muted"><EditText admin={admin} value={site.branch} onChange={(v) => set({ branch: v })} /></p>
          <EditList admin={admin} items={site.requirements} onChange={(v) => set({ requirements: v })} />
          <p className="muted"><EditText multiline admin={admin} value={site.note} onChange={(v) => set({ note: v })} /></p>
        </div>
        <div className="card">
          <h2>What we offer</h2>
          <EditList admin={admin} items={site.offers} onChange={(v) => set({ offers: v })} />
        </div>
      </div>
      <div className="card">
        <h2>How to join</h2>
        <EditText as="p" multiline admin={admin} value={site.join} onChange={(v) => set({ join: v })} />
        {discord && (
          <a className="btn" href={discord.url} target="_blank" rel="noreferrer">
            Join on Discord
          </a>
        )}
      </div>
    </section>
  )
}
