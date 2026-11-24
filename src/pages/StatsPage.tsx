import { useEffect, useState } from 'react'
import { activeLibrary } from '../anki'
import { listEntries, loadAnki, todayId } from '../db'
import { runAchievementSync } from '../achievementsRun'
import type { Achievement } from '../achievements'
import AchievementsView from '../components/AchievementsView'
import { GRAMMAR } from '../prompts/data'
import {
  errorKinds,
  goodPoints,
  monthStats,
  overallPer100,
  streakInfo,
  timesUsed,
  topPoints,
  weekStats,
  wordTotals,
  writingTotals,
  writtenDays,
} from '../stats'
import Block from '../components/Block'
import MonthReview from '../components/MonthReview'
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

/** Un chiffre clé : grande valeur, petit libellé dessous. */
function Fig({ value, label, extra, ja }: { value: string | number; label: string; extra?: string; ja?: boolean }) {
  return (
    <li className="fig">
      <b className="fig-value">{value}</b>
      <span className="fig-label fr" lang={ja ? 'ja' : undefined}>
        {label}
      </span>
      {extra && <span className="fig-extra fr">{extra}</span>}
    </li>
  )
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`
}

type StatsTab = 'progress' | 'reviews' | 'achievements'
const TAB_KEY = 'nikki-stats-tab'

function readTab(): StatsTab {
  try {
    const saved = localStorage.getItem(TAB_KEY)
    return saved === 'reviews' || saved === 'achievements' ? saved : 'progress'
  } catch {
    return 'progress'
  }
}

export default function StatsPage({ settings }: { settings: Settings }) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [library, setLibrary] = useState<AnkiLibrary | null>(null)
  const [tab, setTab] = useState<StatsTab>(readTab)
  const [achievements, setAchievements] = useState<Achievement[] | null>(null)
  const [tip, setTip] = useState<string | null>(null)
  const [wordsOpen, setWordsOpen] = useState(false)
  const [grammarOpen, setGrammarOpen] = useState(false)

  function chooseTab(next: StatsTab) {
    setTab(next)
    try {
      localStorage.setItem(TAB_KEY, next)
    } catch {
      /* stockage indisponible : l'onglet ne sera pas mémorisé */
    }
    document.querySelector('.content')?.scrollTo(0, 0)
  }

  // Un tap ailleurs ferme l'explication ouverte.
  useEffect(() => {
    if (!tip) return
    const close = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('.block-tip, .tip-text')) return
      setTip(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [tip])

  useEffect(() => {
    void listEntries().then(setEntries)
    void runAchievementSync()
      .then((r) => setAchievements(r.all))
      .catch(() => setAchievements(null))
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
  const per100 = overallPer100(entries)

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

  const tipText: Record<string, string> = {
    figures:
      "Jours écrits : les jours où tu as écrit au moins une phrase, depuis le début. De suite : les jours à la suite (un jour sauté ne change rien ; après deux jours sans écrire, la série se met en pause, puis repart à 1 ; ton record n'est jamais effacé). 文字 : le total des caractères écrits. Fautes pour 100 caractères : les fautes relevées par les corrections, ramenées à 100 caractères (plus c'est bas, mieux c'est). Mots : ceux de « Idée du jour » que tu as employés.",
    months: 'Les caractères écrits chaque mois (la barre), avec le nombre de jours écrits dessous.',
    errors:
      "Les fautes relevées par les corrections, classées par type, depuis le début. Plus bas, la semaine par semaine : les fautes ramenées à 100 caractères.",
    words: "Parmi les mots proposés dans « Idée du jour », ceux que tu as employés dans ton texte. Les autres reviennent plus souvent.",
    grammar: "Les points de grammaire que les corrections ont jugés bien employés, sur tous ceux de ton deck et de l'appli.",
  }
  const helpBtn = (id: string) => (
    <button
      type="button"
      className="tip-btn block-tip"
      aria-label="Explication"
      aria-expanded={tip === id}
      onClick={() => setTip((t) => (t === id ? null : id))}
    >
      ?
    </button>
  )
  const helpText = (id: string) =>
    tip === id ? (
      <p className="tip-text fr" role="note">
        {tipText[id]}
      </p>
    ) : null

  const tabs: { id: StatsTab; label: string }[] = [
    { id: 'progress', label: 'Progrès' },
    { id: 'reviews', label: 'Bilans' },
    { id: 'achievements', label: 'Succès' },
  ]

  return (
    <section className="page stats stats-pane">
      <header className="page-header">
        <h1>Statistiques</h1>
      </header>

      <div className="subtabs" role="tablist" aria-label="Sections de Stats">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'subtab active' : 'subtab'}
            onClick={() => chooseTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="stats-body">
        {tab === 'achievements' ? (
          achievements ? <AchievementsView achievements={achievements} /> : null
        ) : tab === 'reviews' ? (
          <>
            <ReviewSection entries={entries} library={library} settings={settings} today={today} />
            <MonthReview entries={entries} today={today} />
          </>
        ) : (
          <>
            <Block role="write" ja="書" title="Jours écrits" className="stat-block" tail={helpBtn('figures')}>
              {helpText('figures')}
              <ul className="figs" aria-label="Chiffres clés">
                <Fig value={totals.days} label="jours" />
                <Fig
                  value={streak.current}
                  label="de suite"
                  extra={[streak.paused ? 'en pause' : '', streak.current < streak.best ? `record ${streak.best}` : ''].filter(Boolean).join(' · ') || undefined}
                />
                <Fig value={totals.chars.toLocaleString('fr-FR')} label="文字" ja />
              </ul>
              <ul className="figs figs-2" aria-label="Fautes et mots">
                <Fig value={per100 === null ? '–' : per100.toFixed(1).replace('.', ',')} label="fautes pour 100 文字" />
                <Fig value={words.used} label="mots utilisés" />
              </ul>
            </Block>

            <Block role="write" ja="月" title="Mois par mois" className="stat-block" tail={helpBtn('months')}>
              {helpText('months')}
              <ul className="months" aria-label="Caractères écrits par mois">
                {months.map((m) => (
                  <li key={m.key}>
                    <span className="month-value fr">{m.chars || ''}</span>
                    <span className="month-bar-wrap">
                      <span className="month-bar" style={{ height: `${Math.max(m.chars ? 6 : 0, (m.chars / maxChars) * 100)}%` }} />
                    </span>
                    <span className="month-label" lang="ja">
                      {m.month}月
                    </span>
                    <span className="month-days fr">{m.days ? `${m.days} j` : ''}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block role="fix" ja="誤" title="Erreurs par type" className="stat-block" tail={helpBtn('errors')}>
              {helpText('errors')}
              {kinds.length === 0 ? (
                <p className="fr empty">Pas encore d'erreur relevée dans les corrections.</p>
              ) : (
                <>
                  <ul className="bars">
                    {kinds.map((k) => (
                      <li key={k.kind}>
                        <span className="bar-label fr">{KIND_LABEL[k.kind] ?? k.kind}</span>
                        <span className="bar-track">
                          <span className="bar red-bar" style={{ width: `${(k.count / maxKind) * 100}%` }} />
                        </span>
                        <span className="bar-count fr">{k.count}</span>
                      </li>
                    ))}
                  </ul>
                  {weekRates.length >= 2 && (
                    <>
                      <p className="fr trend-title">Fautes pour 100 caractères, semaine par semaine (plus c'est bas, mieux c'est)</p>
                      <ul className="trend weekly" aria-label="Fautes pour 100 caractères par semaine">
                        {weeks.map((w) => (
                          <li key={w.monday} title={`Semaine du ${w.monday} : ${w.errors} faute(s), ${w.days} jour(s)`}>
                            <span className="trend-value fr">{w.per100 === null ? '' : w.per100.toFixed(1)}</span>
                            <span
                              className="trend-bar"
                              style={{ height: w.per100 === null ? '0%' : `${Math.max(4, (w.per100 / maxRate) * 100)}%` }}
                            />
                          </li>
                        ))}
                      </ul>
                      <ul className="week-labels fr" aria-hidden="true">
                        {weeks.map((w) => (
                          <li key={w.monday}>
                            <span>
                              {Number(w.monday.slice(8))}/{Number(w.monday.slice(5, 7))}
                            </span>
                            <span>{w.days ? `${w.days} j` : ''}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </Block>

            <Block
              role="write"
              ja="語"
              title="Mots du jour"
              className="stat-block"
              open={wordsOpen}
              onToggle={() => setWordsOpen((v) => !v)}
            >
              {words.proposed === 0 ? (
                <p className="fr empty">Les mots proposés dans « Idée du jour » seront comptés ici.</p>
              ) : (
                <>
                  <p className="fr">
                    {words.used} mot{words.used > 1 ? 's' : ''} employé{words.used > 1 ? 's' : ''} sur {words.proposed} proposé
                    {words.proposed > 1 ? 's' : ''} ({Math.round((words.used / words.proposed) * 100)} %)
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
              <p className="fr tip-inline">{tipText.words}</p>
            </Block>

            <Block
              role="write"
              ja="文"
              title="Grammaire"
              className="stat-block"
              open={grammarOpen}
              onToggle={() => setGrammarOpen((v) => !v)}
            >
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
              <p className="fr tip-inline">{tipText.grammar}</p>
            </Block>
          </>
        )}
      </div>
    </section>
  )
}
