import { useEffect, useRef, useState } from 'react'
import Block, { Pill } from '../components/Block'
import { formatById } from '../formats'
import Stamp from '../components/Stamp'
import { shownStamp } from '../stamps'
import Chevron from '../components/Chevron'
import CorrectionView from '../components/CorrectionView'
import MemoryCard from '../components/MemoryCard'
import { DecorBoard } from '../components/Decor'
import { ENTRY_UPDATED, isRunning, runCorrection } from '../corrector'
import { activeLibrary } from '../anki'
import { deleteEntry, listEntries, loadAnki, todayId } from '../db'
import { countChars, formatDateJa } from '../format'
import { Jp } from '../furigana'
import { GRAMMAR } from '../prompts/data'
import { goodPoints, streakInfo, timesUsed, writtenDays } from '../stats'
import type { AnkiLibrary, Entry, Settings } from '../types'

/** « 20 novembre » (avec l'année si ce n'est pas l'année en cours). */
function dateFr(id: string): string {
  const [y, m, d] = id.split('-').map(Number)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
  if (String(y) !== String(new Date().getFullYear())) opts.year = 'numeric'
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', opts)
}

const dayNum = (id: string) => Date.parse(`${id}T00:00:00Z`) / 86_400_000

/** Les deux petits dessins des boutons de relecture. */
function ShuffleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4" />
    </svg>
  )
}

interface Props {
  settings: Settings
  /** Ouvre ce jour dans l'écran d'écriture. */
  onOpenDay: (id: string) => void
}

export default function HistoryPage({ settings, onOpenDay }: Props) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [library, setLibrary] = useState<AnkiLibrary | null>(null)
  const [, bump] = useState(0)
  // Mois ouverts ou fermés à la main ; sans choix, seul le mois le plus récent est ouvert (S18.16).
  const [monthChoice, setMonthChoice] = useState<Record<string, boolean>>({})
  // Relecture (S13.1) : entrée tirée au hasard, choix d'une date, et jour proche proposé quand il n'y a rien ce jour-là.
  const [readId, setReadId] = useState<string | null>(null)
  const [readKind, setReadKind] = useState<'random' | 'date'>('random')
  const [dateOpen, setDateOpen] = useState(false)
  const [dateValue, setDateValue] = useState(() => todayId())
  const [nearestId, setNearestId] = useState<string | null>(null)
  const [dateAsked, setDateAsked] = useState<string | null>(null)
  const [nothingYet, setNothingYet] = useState(false)
  const readRef = useRef<HTMLElement>(null)

  useEffect(() => {
    void loadAnki()
      .then(setLibrary)
      .catch(() => setLibrary(null))
  }, [])

  useEffect(() => {
    const load = () =>
      void listEntries().then((all) => setEntries(all.filter((e) => e.text.trim() !== '' || e.photos?.length || e.stickers?.length)))
    load()
    window.addEventListener(ENTRY_UPDATED, load)
    return () => window.removeEventListener(ENTRY_UPDATED, load)
  }, [])

  async function remove(id: string) {
    if (!window.confirm('Supprimer cette entrée ? Cette action est définitive.')) {
      return
    }
    await deleteEntry(id)
    setEntries((prev) => prev?.filter((e) => e.id !== id) ?? null)
    setOpenId(null)
    setReadId((r) => (r === id ? null : r))
  }

  /** Corrige une entrée depuis la liste ; le résultat arrive par l'événement ENTRY_UPDATED. */
  function correctNow(id: string) {
    void runCorrection(id, settings)
    bump((n) => n + 1)
  }

  // La relecture apparaît sous les boutons : on s'assure qu'elle est à l'écran.
  useEffect(() => {
    if (!readId) return
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    readRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest' })
  }, [readId])

  /** Montre une entrée sous les boutons de relecture, sans rien modifier. */
  function reveal(id: string, kind: 'random' | 'date') {
    setReadKind(kind)
    setReadId(id)
  }

  function openRandom() {
    const past = (entries ?? []).filter((e) => e.id !== todayId())
    setNearestId(null)
    setDateAsked(null)
    if (past.length === 0) {
      setNothingYet(true)
      setReadId(null)
      return
    }
    setNothingYet(false)
    // « Une autre » : pas la même qu'à l'instant, sauf s'il n'y en a pas d'autre.
    const fresh = past.filter((e) => e.id !== readId)
    const others = fresh.length > 0 ? fresh : past
    const pick = others[Math.floor(Math.random() * others.length)]
    reveal(pick.id, 'random')
  }

  function openDate() {
    if (!dateValue || !entries) return
    const found = entries.find((e) => e.id === dateValue)
    if (found) {
      setNearestId(null)
      setDateAsked(null)
      setDateOpen(false)
      reveal(found.id, 'date')
      return
    }
    // Rien ce jour-là : on propose l'entrée la plus proche, sans message d'échec.
    const target = dayNum(dateValue)
    const close = [...entries].sort((a, b) => Math.abs(dayNum(a.id) - target) - Math.abs(dayNum(b.id) - target) || (a.id < b.id ? 1 : -1))[0]
    setDateAsked(dateValue)
    setNearestId(close?.id ?? null)
  }

  if (!entries) return null

  const readEntry = readId ? entries.find((e) => e.id === readId) : undefined
  const thisYear = String(new Date().getFullYear())
  const today = todayId()
  const streak = streakInfo(writtenDays(entries), today)
  // Points de la liste (intégrée + deck) déjà bien employés d'après les corrections.
  const good = goodPoints(entries)
  const own = activeLibrary(library).grammar
  const candidates = [...own, ...GRAMMAR]
  const placed = candidates.filter((g) => timesUsed(g.pattern, good) > 0).length

  const WEEK = ['日', '月', '火', '水', '木', '金', '土']
  const months: { id: string; items: Entry[] }[] = []
  for (const entry of entries) {
    const m = entry.id.slice(0, 7)
    const last = months[months.length - 1]
    if (last && last.id === m) last.items.push(entry)
    else months.push({ id: m, items: [entry] })
  }
  const monthLabel = (m: string) => `${m.slice(0, 4) !== thisYear ? `${m.slice(0, 4)}年` : ''}${Number(m.slice(5))}月`
  const dayLabel = (id: string) => {
    const [y, mo, d] = id.split('-').map(Number)
    return { day: `${d}日`, week: WEEK[new Date(y, mo - 1, d).getDay()] }
  }

  /** Le contenu d'une entrée ouverte : format, thème, texte, correction, boutons. Même rendu dans la liste et dans la relecture. */
  const body = (entry: Entry) => (
        <div className="entry-body">
          {entry.format && entry.format !== 'journal' && (
            <p className="entry-format">
              <Pill role="write">{formatById(entry.format).ja}</Pill>
              <span className="fr">{formatById(entry.format).fr}</span>
            </p>
          )}
          {entry.prompt && (
            <p lang="ja" className="entry-topic">
              お題：<Jp text={entry.prompt.topic.ja} furigana={settings.furiganaFrom} />
              {!entry.prompt.themeOnly && <span className="fr"> ・ {entry.prompt.grammar.pattern}</span>}
            </p>
          )}
          <div className="sheet-wrap">
            <p lang="ja" className="sheet entry-text">
              {entry.text}
            </p>
            {(() => {
              const kind = shownStamp(entry)
              return kind ? <Stamp kind={kind} size={76} tilt={-8} className="sheet-stamp" /> : null
            })()}
          </div>
          <DecorBoard photos={entry.photos ?? []} stickers={entry.stickers ?? []} />
          {entry.correction && (
            <CorrectionView
              correction={entry.correction}
              furigana={settings.furiganaFrom}
              stale={entry.correction.sourceText !== entry.text}
              entryId={entry.id}
              settings={settings}
            />
          )}
          {!entry.correction && entry.text.trim() !== '' && (
            <p className="fr">
              {entry.correctionError && <span className="problem">{entry.correctionError} </span>}
              {settings.apiKey ? (
                <button
                  className="sketch primary"
                  disabled={isRunning(entry.id)}
                  onClick={() => correctNow(entry.id)}
                >
                  {isRunning(entry.id) ? 'Correction en cours…' : 'Corriger maintenant'}
                </button>
              ) : (
                'Ajoute ta clé API dans les réglages pour corriger cette entrée.'
              )}
            </p>
          )}
          <button className="sketch" onClick={() => onOpenDay(entry.id)}>
            Modifier
          </button>{' '}
          <button
            className="sketch danger"
            onClick={() => void remove(entry.id)}
          >
            Supprimer
          </button>
        </div>
  )

  return (
    <section className="page">
      <header className="page-header">
        <h1>Historique</h1>
        {entries.length === 0 && <p className="muted">Aucune entrée pour le moment. Écris la première dans l’onglet Écrire.</p>}
      </header>

      {entries.length > 0 && (
        <div className="hist-relire">
          <div className="hist-actions">
            <button type="button" className="sketch" onClick={openRandom}>
              <ShuffleIcon />
              <span>Au hasard</span>
            </button>
            <button
              type="button"
              className="sketch"
              aria-expanded={dateOpen}
              onClick={() => {
                setDateOpen((v) => !v)
                setNearestId(null)
                setDateAsked(null)
              }}
            >
              <CalendarIcon />
              <span>Une date</span>
            </button>
          </div>
          {nothingYet && (
            <p className="fr muted hist-note" role="status">
              Il n’y a pas encore d’ancienne entrée à relire : elle viendra.
            </p>
          )}
          {dateOpen && (
            <div className="hist-date">
              <div className="hist-datebox">
                <input
                  type="date"
                  className="hist-dateinput"
                  aria-label="Date à ouvrir"
                  value={dateValue}
                  max={todayId()}
                  onChange={(e) => {
                    setDateValue(e.target.value)
                    setNearestId(null)
                    setDateAsked(null)
                  }}
                />
                <button type="button" className="sketch" disabled={!dateValue} onClick={openDate}>
                  Voir
                </button>
              </div>
              {dateAsked && nearestId && (
                <div className="hist-nearest" role="status">
                  <p className="fr">
                    Pas d’entrée le {dateFr(dateAsked)}.
                    <br />
                    <span className="muted">La plus proche est celle du {dateFr(nearestId)}.</span>
                  </p>
                  <button
                    type="button"
                    className="sketch"
                    onClick={() => {
                      const id = nearestId
                      setNearestId(null)
                      setDateAsked(null)
                      setDateOpen(false)
                      reveal(id, 'date')
                    }}
                  >
                    Ouvrir le {dateFr(nearestId)}
                  </button>
                </div>
              )}
            </div>
          )}
          {readId && entries.some((e) => e.id === readId) && (
            <div className="hist-band">
              <span className="fr">{readKind === 'random' ? 'Tirée au hasard' : `Entrée du ${dateFr(readId)}`}</span>
              {readKind === 'random' && (
                <button type="button" className="sketch" onClick={openRandom}>
                  Une autre
                </button>
              )}
            </div>
          )}
          {readEntry && (
            <article ref={readRef} data-entry-id={readEntry.id} className="hist-read entry" aria-label="Entrée à relire">
              <div className="hist-read-head">
                <span lang="ja" className="ep ep-open">
                  {formatDateJa(readEntry.id, readEntry.id.slice(0, 4) !== String(new Date().getFullYear()))}
                </span>
                <span className="em">
                  {readEntry.correction ? (
                    <span className="seal" lang="ja" role="img" aria-label="Corrigée">
                      添
                    </span>
                  ) : readEntry.text.trim() !== '' ? (
                    <span className="fr todo">pas corrigée</span>
                  ) : null}
                  <span className="entry-count">{countChars(readEntry.text)} 文字</span>
                </span>
              </div>
              {body(readEntry)}
              <button type="button" className="sketch hist-read-close" onClick={() => setReadId(null)}>
                Fermer
              </button>
            </article>
          )}
        </div>
      )}

      {entries.length > 0 && (
        <Block role="write" ja="記録" title="En chiffres" className="hist-figs">
          <div className="figs">
            <div className="fig">
              <b>{entries.length}</b>
              <small>entrée{entries.length > 1 ? 's' : ''}</small>
            </div>
            <div className="fig">
              <b>{streak.current}</b>
              <small>jour{streak.current > 1 ? 's' : ''} de suite{streak.paused ? ' (en pause)' : ''}</small>
            </div>
            <div className="fig">
              <b>{streak.best}</b>
              <small>record</small>
            </div>
            {good.length > 0 && (
              <div className="fig">
                <b>{placed}</b>
                <small>point{placed > 1 ? 's' : ''} de grammaire placé{placed > 1 ? 's' : ''}</small>
              </div>
            )}
          </div>
        </Block>
      )}

      {entries.length > 0 && <MemoryCard id={today} />}

      {months.map((month, mi) => {
        const monthOpen = monthChoice[month.id] ?? mi === 0
        return (
          <div key={month.id} className="month-group">
            <h2 className="month-head">
              <button
                type="button"
                className="fold"
                aria-expanded={monthOpen}
                onClick={() => setMonthChoice((c) => ({ ...c, [month.id]: !monthOpen }))}
              >
                <span lang="ja" className="month-name">
                  {monthLabel(month.id)}
                </span>
                <small className="fr">
                  {month.items.length} entrée{month.items.length > 1 ? 's' : ''}
                </small>
                <span className="fold-icon">
                  <Chevron dir={monthOpen ? 'down' : 'right'} size={20} />
                </span>
              </button>
            </h2>
            {monthOpen && (
      <ul className="entry-list">
        {month.items.map((entry) => {
          const open = entry.id === openId
          const dl = dayLabel(entry.id)
          return (
            <li key={entry.id} id={`entry-${entry.id}`} className="entry">
              <button
                className="entry-head"
                onClick={() => setOpenId(open ? null : entry.id)}
                aria-expanded={open}
              >
                <span lang="ja" className="ed">
                  {dl.day}
                  <br />
                  {dl.week}
                </span>
                {/* L'aperçu fait partie du bouton : toute la ligne ouvre l'entrée. */}
                <span lang="ja" className={open ? 'ep ep-open' : 'ep'}>
                  {open ? formatDateJa(entry.id, entry.id.slice(0, 4) !== thisYear) : entry.text}
                </span>
                <span className="em">
                  {entry.correction ? (
                    <span className="seal" lang="ja" role="img" aria-label="Corrigée">
                      添
                    </span>
                  ) : entry.text.trim() !== '' ? (
                    <span className="fr todo">pas corrigée</span>
                  ) : null}
                  <span className="entry-count">{countChars(entry.text)} 文字</span>
                </span>
              </button>
              {!open && <DecorBoard small photos={entry.photos ?? []} stickers={entry.stickers ?? []} />}
              {open && body(entry)}
            </li>
          )
        })}
      </ul>
            )}
          </div>
        )
      })}
    </section>
  )
}
