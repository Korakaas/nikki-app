import { useState } from 'react'
import type { UsageLog } from '../db'
import { CAP_ALERT_SHARE, capShare, costByFunction, formatCost, monthId, monthUsage, previousMonthId } from '../usage'
import type { Settings } from '../types'
import Block from './Block'
import CapNotice from './CapNotice'

interface Props {
  settings: Settings
  usage: UsageLog
  onChange: (next: Settings) => void
}

/**
 * Budget visible (S12.3) : le coût du mois par fonction, la barre du plafond et le plafond modifiable.
 * Une estimation d'après les tarifs publiés, jamais bloquante.
 */
export default function BudgetBlock({ settings, usage, onChange }: Props) {
  const now = monthUsage(usage, monthId())
  const last = monthUsage(usage, previousMonthId())
  const rows = costByFunction(usage, monthId())
  const pct = capShare(now.cost, settings.monthlyCap)
  const biggest = Math.max(0.0001, ...rows.map((r) => r.cost))

  return (
    <Block role="set" ja="費" title="Budget du mois">
      <CapNotice settings={settings} />
      <p className="lead">
        Ce mois-ci : <strong>≈ {formatCost(now.cost)}</strong> sur {formatCost(settings.monthlyCap)}
      </p>
      <div
        className={`cap-bar${pct >= CAP_ALERT_SHARE ? ' near' : ''}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(pct * 100))}
        aria-label="Part du plafond du mois"
      >
        <i style={{ width: `${Math.min(100, pct * 100)}%` }} />
      </div>
      <ul className="budget-rows" aria-label="Coût du mois par fonction">
        {rows.map((r) => (
          <li key={r.id} className="budget-row">
            <span className="budget-name fr">{r.label}</span>
            <span className="budget-cost fr">{r.calls > 0 ? `≈ ${formatCost(r.cost)}` : '0 $'}</span>
            <span className="budget-calls fr">{r.calls === 1 ? '1 appel' : `${r.calls} appels`}</span>
            <span className="budget-share" aria-hidden="true">
              <i style={{ width: `${Math.round((r.cost / biggest) * 100)}%` }} />
            </span>
          </li>
        ))}
      </ul>
      {last.calls > 0 && (
        <p className="hint">
          Mois dernier : ≈ {formatCost(last.cost)} ({last.calls} appels).
        </p>
      )}
      <CapField value={settings.monthlyCap} onCommit={(v) => onChange({ ...settings, monthlyCap: v })} />
      <p className="hint">
        Estimation d'après les tarifs publiés (Sonnet 5.5 : 2 $ / 10 $ par million de jetons ; Haiku 5.5 : 0,10 $ / 0,50 $) ; elle ne
        compte que les appels faits depuis ce téléphone. Le chiffre exact est sur console.anthropic.com. Rien n'est jamais bloqué.
      </p>
    </Block>
  )
}

function CapField({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [text, setText] = useState(String(value).replace('.', ','))
  const commit = () => {
    const v = Number(text.replace(',', '.'))
    if (Number.isFinite(v) && v > 0) onCommit(Math.round(v * 100) / 100)
    else setText(String(value).replace('.', ','))
  }
  return (
    <div className="cap-field">
      <label htmlFor="monthly-cap">Plafond du mois</label>
      <input
        id="monthly-cap"
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      <span>$</span>
    </div>
  )
}
