import { useEffect, useState } from 'react'
import Block, { Pill } from '../components/Block'
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
  }

  /** Corrige une entrée depuis la liste ; le résultat arrive par l'événement ENTRY_UPDATED. */
  function correctNow(id: string) {
    void runCorrection(id, settings)
    bump((n) => n + 1)
  }

  if (!entries) return null

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

  return (
    <section className="page">
      <header className="page-header">
        <h1>Historique</h1>
        {entries.length === 0 && <p className="muted">Aucune entrée pour le moment. Écris la première dans l’onglet Écrire.</p>}
      </header>

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
            <li key={entry.id} className="entry">
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
                    <Pill role="fix">添</Pill>
                  ) : entry.text.trim() !== '' ? (
                    <span className="fr todo">pas corrigée</span>
                  ) : null}
                  <span className="entry-count">{countChars(entry.text)} 文字</span>
                </span>
              </button>
              {!open && <DecorBoard small photos={entry.photos ?? []} stickers={entry.stickers ?? []} />}
              {open && (
                <div className="entry-body">
                  {entry.prompt && (
                    <p lang="ja" className="entry-topic">
                      お題：<Jp text={entry.prompt.topic.ja} furigana={settings.furiganaFrom} />
                      {!entry.prompt.themeOnly && <span className="fr"> ・ {entry.prompt.grammar.pattern}</span>}
                    </p>
                  )}
                  <p lang="ja" className="sheet entry-text">
                    {entry.text}
                  </p>
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
              )}
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
