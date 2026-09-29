// Renders text; becomes an input/textarea when the viewer is an admin.
export function EditText({ value, onChange, admin, multiline, className = '', as: Tag = 'span' }) {
  if (!admin) return <Tag className={className}>{value}</Tag>
  const props = {
    className: `edit ${className}`,
    value,
    onChange: (e) => onChange(e.target.value),
  }
  return multiline ? <textarea rows={4} {...props} /> : <input {...props} />
}

export function EditList({ items, onChange, admin, empty = '' }) {
  return (
    <ul className="list">
      {items.map((it, i) => (
        <li key={i}>
          <EditText
            admin={admin}
            value={it}
            onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
          />
          {admin && (
            <button className="x" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              ✕
            </button>
          )}
        </li>
      ))}
      {admin && (
        <li>
          <button className="ghost" onClick={() => onChange([...items, empty])}>
            + Add
          </button>
        </li>
      )}
    </ul>
  )
}
