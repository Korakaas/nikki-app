import { useEffect, useState } from 'react'
import { activeLibrary } from '../anki'
import { listEntries, loadAnki, todayId } from '../db'
import { GRAMMAR } from '../prompts/data'
import {
  errorKinds,
  goodPoints,
  monthStats,
  streakInfo,
  timesUsed,
  topPoints,
  weekStats,
  wordTotals,
  writingTotals,
  writtenDays,
} from '../stats'
import ErrorQuiz from '../components/ErrorQuiz'
import ReviewSection from '../components/ReviewSection'
import type { AnkiLibrary, Entry, Settings } from '../types'

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

export default function StatsPage({ settings }: { settings: Settings }) {
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
  const weeks = weekStats(entries, today)
  const weekRates = weeks.filter((w) => w.per100 !== null)
  const maxRate = Math.max(1, ...weekRates.map((w) => w.per100 ?? 0))
  const words = wordTotals(entries)
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

      <ReviewSection entries={entries} library={library} settings={settings} today={today} />

      <ErrorQuiz entries={entries} furigana={settings.furiganaFrom} />

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
          {weekRates.length >= 2 && (
            <>
              <p className="fr trend-title">
                Fautes pour 100 caractères, semaine par semaine (plus c'est bas, mieux c'est)
              </p>
              <ul className="trend weekly" aria-label="Fautes pour 100 caractères par semaine">
                {weeks.map((w) => (
                  <li key={w.monday} title={`Semaine du ${w.monday} : ${w.errors} faute(s), ${w.days} jour(s)`}>
                    <span className="trend-value fr">
                      {w.per100 === null ? '' : w.per100.toFixed(1)}
                    </span>
                    <span
                      className="trend-bar"
                      style={{
                        height: w.per100 === null ? '0%' : `${Math.max(4, (w.per100 / maxRate) * 100)}%`,
                      }}
                    />
                  </li>
                ))}
              </ul>
              <ul className="week-labels fr" aria-hidden="true">
                {weeks.map((w) => (
                  <li key={w.monday}>
                    <span>{Number(w.monday.slice(8))}/{Number(w.monday.slice(5, 7))}</span>
                    <span>{w.days ? `${w.days} j` : ''}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <Heading ja="単語" fr="Mots du jour" />
      {words.proposed === 0 ? (
        <p className="fr empty">Les mots proposés dans « Idée du jour » seront comptés ici.</p>
      ) : (
        <>
          <p className="fr">
            {words.used} mot{words.used > 1 ? 's' : ''} employé{words.used > 1 ? 's' : ''} sur{' '}
            {words.proposed} proposé{words.proposed > 1 ? 's' : ''} (
            {Math.round((words.used / words.proposed) * 100)} %)
          </p>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${(words.used / words.proposed) * 100}%` }} />
          </div>
          {words.unused.length > 0 && (
            <>
              <h3 className="sub fr">Proposés mais pas encore employés</h3>
              <ul className="point-list" lang="ja">
                {words.unused.slice(0, 6).map((w) => (
                  <li key={w.ja}>
                    <span className="mark red-ink">△</span> {w.ja}
                    {w.reading && <span className="fr"> ({w.reading})</span>}
                    <span className="fr"> — {w.fr}</span>
                  </li>
                ))}
              </ul>
              <p className="fr empty">Ils reviennent plus souvent dans les idées du jour.</p>
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
