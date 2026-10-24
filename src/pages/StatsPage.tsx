import { useEffect, useState } from 'react'
import { activeLibrary } from '../anki'
import { listEntries, loadAnki, todayId } from '../db'
import { GRAMMAR } from '../prompts/data'
import {
  errorKinds,
  errorTrend,
  goodPoints,
  monthStats,
  streakInfo,
  timesUsed,
  topPoints,
  writingTotals,
  writtenDays,
} from '../stats'
import type { AnkiLibrary, Entry } from '../types'

const KIND_LABEL: Record<string, string> = {
  particule: 'particules',
  conjugaison: 'conjugaisons',
  vocabulaire: 'vocabulaire',
  grammaire: 'grammaire',
  registre: 'registre',
  orthographe: 'orthographe',
  naturel: 'naturel',
}

function Heading({ ja, fr }: { ja: string; fr: string }) {
  return (
    <h2 className="part">
      <span lang="ja">{ja}</span>
      <span className="fr">{fr}</span>
    </h2>
  )
}

function Figure({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="figure">
      <span className="figure-value green-ink">{value}</span>
      <span className="figure-label fr">{label}</span>
    </div>
  )
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`
}

export default function StatsPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [library, setLibrary] = useState<AnkiLibrary | null>(null)

  useEffect(() => {
    void listEntries().then(setEntries)
    void loadAnki()
      .then(setLibrary)
      .catch(() => setLibrary(null))
  }, [])

  if (!entries) return null

  const today = todayId()
  const days = writtenDays(entries)
  const streak = streakInfo(days, today)
  const totals = writingTotals(entries)
  const months = monthStats(entries, today)
  const maxChars = Math.max(1, ...months.map((m) => m.chars))
  const kinds = errorKinds(entries)
  const maxKind = Math.max(1, ...kinds.map((k) => k.count))
  const trend = errorTrend(entries)
  const maxTrend = Math.max(1, ...trend.map((t) => t.per100))
  const points = topPoints(entries)

  const good = goodPoints(entries)
  const candidates = [...activeLibrary(library).grammar, ...GRAMMAR]
  const placed = candidates.filter((g) => timesUsed(g.pattern, good) > 0).length

  if (totals.days === 0) {
    return (
      <section className="page">
        <header className="page-header">
          <h1>Statistiques</h1>
          <p className="muted">Écris une première entrée : les chiffres apparaîtront ici.</p>
        </header>
      </section>
    )
  }

  return (
    <section className="page stats">
      <header className="page-header">
        <h1>Statistiques</h1>
      </header>

      <Heading ja="書いた日" fr="Écriture" />
      <div className="figures">
        <Figure value={totals.days} label="jours écrits" />
        <Figure value={streak.current} label="jours de suite" />
        <Figure value={streak.best} label="record de série" />
        <Figure value={totals.chars.toLocaleString('fr-FR')} label="caractères" />
        <Figure value={totals.average} label="par entrée" />
        <Figure value={totals.corrected} label="corrigées" />
      </div>

      <Heading ja="月ごと" fr="Mois par mois" />
      <ul className="months" aria-label="Caractères écrits par mois">
        {months.map((m) => (
          <li key={m.key}>
            <span className="month-value fr">{m.chars || ''}</span>
            <span className="month-bar-wrap">
              <span
                className="month-bar"
                style={{ height: `${Math.max(m.chars ? 6 : 0, (m.chars / maxChars) * 100)}%` }}
              />
            </span>
            <span className="month-label" lang="ja">
              {m.month}月
            </span>
            <span className="month-days fr">{m.days ? `${m.days} j` : ''}</span>
          </li>
        ))}
      </ul>

      <Heading ja="まちがい" fr="Erreurs" />
      {kinds.length === 0 ? (
        <p className="fr empty">Pas encore d'erreur relevée dans les corrections.</p>
      ) : (
        <>
          <ul className="bars">
            {kinds.map((k) => (
              <li key={k.kind}>
                <span className="bar-label fr">{KIND_LABEL[k.kind] ?? k.kind}</span>
                <span className="bar-track">
                  <span
                    className="bar red-bar"
                    style={{ width: `${(k.count / maxKind) * 100}%` }}
                  />
                </span>
                <span className="bar-count fr">{k.count}</span>
              </li>
            ))}
          </ul>
          {trend.length >= 2 && (
            <>
              <p className="fr trend-title">
                Fautes pour 100 caractères, sur tes {trend.length} dernières corrections
                (plus c'est bas, mieux c'est)
              </p>
              <ul className="trend" aria-label="Fautes pour 100 caractères">
                {trend.map((t) => (
                  <li key={t.id} title={`${t.id} : ${t.errors} faute(s)`}>
                    <span className="trend-value fr">{t.per100.toFixed(1)}</span>
                    <span
                      className="trend-bar"
                      style={{ height: `${Math.max(4, (t.per100 / maxTrend) * 100)}%` }}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <Heading ja="文法" fr="Grammaire" />
      <p className="fr">
        {plural(placed, 'point bien placé', 'points bien placés')} sur {candidates.length}
      </p>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${(placed / Math.max(1, candidates.length)) * 100}%` }} />
      </div>

      {points.good.length > 0 && (
        <>
          <h3 className="sub fr">Souvent bien employés</h3>
          <ul className="point-list" lang="ja">
            {points.good.slice(0, 5).map((p) => (
              <li key={p.point}>
                <span className="mark green-ink">○</span> {p.point}
                <span className="fr"> ×{p.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {points.review.length > 0 && (
        <>
          <h3 className="sub fr">À revoir souvent</h3>
          <ul className="point-list" lang="ja">
            {points.review.slice(0, 5).map((p) => (
              <li key={p.point}>
                <span className="mark red-ink">△</span> {p.point}
                <span className="fr"> ×{p.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
