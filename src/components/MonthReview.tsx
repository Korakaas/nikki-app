import { useState } from 'react'
import { monthReview, previousMonth } from '../stats'
import type { Entry } from '../types'
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

  /** Flèche de la variation (au moins 5 %), verte si c'est dans le bon sens, rouge sinon. */
  const trend = (now: number | null, was: number | null, lowerIsBetter: boolean) => {
    if (now === null || was === null || was === 0 || Math.abs(now - was) / was < 0.05) return null
    const up = now > was
    const better = lowerIsBetter ? !up : up
    return (
      <span className={better ? 'green-ink' : 'red-ink'} aria-label={up ? 'en hausse' : 'en baisse'}>
        {' '}
        {up ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <>
      <h2 className="part">
        <span lang="ja">月の振り返り</span>
        <span className="fr">Bilan du mois</span>
      </h2>
      <div className="month-nav">
        <button type="button" className="sketch month-arrow" aria-label="Mois précédent" disabled={!older} onClick={() => setMonth(previousMonth(month))}>
          <Chevron dir="left" size={20} />
        </button>
        <strong className="fr month-name">{label(month)}</strong>
        <button
          type="button"
          className="sketch month-arrow"
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
          <ul className="month-compare fr">
            <li>
              <strong>{data.days}</strong> jour{data.days > 1 ? 's' : ''} écrit{data.days > 1 ? 's' : ''}
              {hasPrev && <span className="muted"> (mois d'avant : {data.prev.days})</span>}
            </li>
            <li>
              <strong>{data.average}</strong> caractères par entrée
              {hasPrev && <span className="muted"> (avant : {data.prev.average})</span>}
              {trend(data.average, data.prev.average, false)}
            </li>
            <li>
              <strong>{fmt(data.per100)}</strong> fautes pour 100 caractères
              {hasPrev && <span className="muted"> (avant : {fmt(data.prev.per100)})</span>}
              {trend(data.per100, data.prev.per100, true)}
            </li>
            {data.words.proposed > 0 && (
              <li>
                <strong>{data.words.used}</strong> mot{data.words.used > 1 ? 's' : ''} du jour employé
                {data.words.used > 1 ? 's' : ''} sur {data.words.proposed}
              </li>
            )}
          </ul>

          {data.corrected < 2 && (
            <p className="fr empty">Peu d'entrées corrigées ce mois-ci : les chiffres de fautes sont fragiles.</p>
          )}

          {data.kinds.length > 0 && (
            <>
              <h3 className="sub fr">Fautes par type (ce mois-ci / avant)</h3>
              <ul className="month-kinds fr">
                {data.kinds.map((k) => (
                  <li key={k.kind}>
                    {KIND_FR[k.kind] ?? k.kind} : <strong>{k.count}</strong>
                    {hasPrev && <span className="muted"> / {k.prev}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}

          {data.newlyGood.length > 0 && (
            <>
              <h3 className="sub fr">Réussis pour la première fois</h3>
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
              <h3 className="sub fr">À revoir, puis réussis</h3>
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
              <h3 className="sub fr">Encore à revoir</h3>
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
    </>
  )
}
