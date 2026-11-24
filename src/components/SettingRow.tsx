import type { ReactNode } from 'react'
import Chevron from './Chevron'

/** Une ligne de réglage compacte (S18.12) : « libellé … valeur › ». Un tap déplie le réglage en dessous. */
export default function SettingRow({
  id,
  label,
  value,
  open,
  onToggle,
  children,
}: {
  id: string
  label: string
  value?: string
  open: boolean
  onToggle: () => void
  children?: ReactNode
}) {
  return (
    <li className="setting-row">
      <button
        type="button"
        className="row-line"
        aria-expanded={open}
        aria-controls={`panel-${id}`}
        onClick={onToggle}
      >
        <span className="rt">{label}</span>
        {value ? <span className="rv">{value}</span> : null}
        <span className="rc">
          <Chevron dir={open ? 'down' : 'right'} size={18} />
        </span>
      </button>
      {open && (
        <div className="row-panel field" id={`panel-${id}`}>
          {children}
        </div>
      )}
    </li>
  )
}
