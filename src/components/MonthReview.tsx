import { useState } from 'react'
import { monthReview, previousMonth } from '../stats'
import type { Entry } from '../types'
import Block from './Block'
import Chevron from './Chevron'

const KIND_FR: Record<string, string> = {
  particule: 'Particules',
  conjugaison: 'Conjugaison',
  vocabulaire: 'Vocabulaire',
  grammaire: 'Grammaire',
  registre: 'Registre',
  orthographe: 'Orthographe',
  naturel: 'Naturel',
}

function label(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const fmt = (n: number | null) => (n === null ? '–' : n.toFixed(1).replace('.', ','))

/** Compare le mois choisi au mois d'avant : tout se calcule sur le téléphone, sans appel à l'API. */
export default function MonthReview({ entries, today }: { entries: Entry[]; today: string }) {
  const current = today.slice(0, 7)
  const first = entries.filter((e) => e.text.trim() !== '').map((e) => e.id.slice(0, 7)).sort()[0] ?? current
  const [month, setMonth] = useState(current)
  const data = monthReview(entries, month)
  const hasPrev = data.prev.days > 0
  const older = previousMonth(month) >= first
  const newer = month < current

  /** Flèche de variation en carte : verte si c'est dans le bon sens, jamais rouge (rien de punitif). */
  const arrow = (now: number | null, was: number | null, lowerIsBetter: boolean) => {
    if (now === null || was === null || was === 0 || Math.abs(now - was) / was < 0.05) return null
    const up = now > was
    const better = lowerIsBetter ? !up : up
    return (
      <span className={better ? 'trend-good' : 'trend-flat'} aria-label={up ? 'en hausse' : 'en baisse'}>
        {up ? '↑' : '↓'}
      </span>
    )
  }
  const maxKind = Math.max(1, ...data.kinds.map((k) => Math.max(k.count, k.prev)))

  return (
    <Block role="write" ja="月" title="Bilan du mois" className="stat-block month-block">
      <div className="month-nav">
        <button type="button" className="month-arrow" aria-label="Mois précédent" disabled={!older} onClick={() => setMonth(previousMonth(month))}>
          <Chevron dir="left" size={20} />
        </button>
        <strong className="fr month-name">{label(month)}</strong>
        <button
          type="button"
          className="month-arrow"
          aria-label="Mois suivant"
          disabled={!newer}
          onClick={() => {
            const [y, m] = month.split('-').map(Number)
            const d = new Date(y, m, 1)
            setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
          }}
        >
          <Chevron dir="right" size={20} />
        </button>
      </div>

      {data.days === 0 ? (
        <p className="fr empty">Aucune entrée ce mois-ci.</p>
      ) : (
        <>
          <ul className="month-figs fr">
            <li className="month-fig">
              <b>{data.days}</b>
              <span>jour{data.days > 1 ? 's' : ''} écrit{data.days > 1 ? 's' : ''}</span>
              {hasPrev && <small>avant : {data.prev.days}</small>}
            </li>
            <li className="month-fig">
              <b>
                {data.average}
                {arrow(data.average, data.prev.average, false)}
              </b>
              <span>caractères par entrée</span>
              {hasPrev && <small>avant : {data.prev.average}</small>}
            </li>
            <li className="month-fig">
              <b>
                {fmt(data.per100)}
                {arrow(data.per100, data.prev.per100, true)}
              </b>
              <span>fautes pour 100 caractères</span>
              {hasPrev && <small>avant : {fmt(data.prev.per100)}</small>}
            </li>
            {data.words.proposed > 0 && (
              <li className="month-fig">
                <b>
                  {data.words.used}
                  <i> / {data.words.proposed}</i>
                </b>
                <span>mots du jour employés</span>
              </li>
            )}
          </ul>

          {data.corrected < 2 && (
            <p className="fr empty">Peu d'entrées corrigées ce mois-ci : les chiffres de fautes sont fragiles.</p>
          )}

          {data.kinds.length > 0 && (
            <>
              <h3 className="sub fr sub-line">
                <span>Fautes par type</span>
                {hasPrev && <small>ce mois-ci / avant</small>}
              </h3>
              <ul className="bars month-bars">
                {data.kinds.map((k) => (
                  <li key={k.kind}>
                    <span className="bar-label fr">{KIND_FR[k.kind] ?? k.kind}</span>
                    <span className="bar-track">
                      <span className="bar red-bar" style={{ width: `${(k.count / maxKind) * 100}%` }} />
                    </span>
                    <span className="bar-count fr">
                      {k.count}
                      {hasPrev && <span className="muted"> / {k.prev}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {data.newlyGood.length > 0 && (
            <>
              <h3 className="sub fr sub-line">
                <span>Réussis pour la première fois</span>
              </h3>
              <ul className="point-list" lang="ja">
                {data.newlyGood.slice(0, 8).map((p) => (
                  <li key={p}>
                    <span className="mark green-ink">○</span> {p}
                  </li>
                ))}
              </ul>
            </>
          )}
          {data.recovered.length > 0 && (
            <>
              <h3 className="sub fr sub-line">
                <span>À revoir, puis réussis</span>
              </h3>
              <ul className="point-list" lang="ja">
                {data.recovered.slice(0, 8).map((p) => (
                  <li key={p}>
                    <span className="mark green-ink">↗</span> {p}
                  </li>
                ))}
              </ul>
            </>
          )}
          {data.stillReview.length > 0 && (
            <>
              <h3 className="sub fr sub-line">
                <span>Encore à revoir</span>
              </h3>
              <ul className="point-list" lang="ja">
                {data.stillReview.slice(0, 8).map((p) => (
                  <li key={p}>
                    <span className="mark red-ink">△</span> {p}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Block>
  )
}
