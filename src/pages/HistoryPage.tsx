import { useEffect, useState } from 'react'
import CorrectionView from '../components/CorrectionView'
import { ENTRY_UPDATED } from '../corrector'
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

  useEffect(() => {
    void loadAnki()
      .then(setLibrary)
      .catch(() => setLibrary(null))
  }, [])

  useEffect(() => {
    const load = () =>
      void listEntries().then((all) => setEntries(all.filter((e) => e.text.trim() !== '')))
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

  if (!entries) return null

  const thisYear = String(new Date().getFullYear())
  const today = todayId()
  const streak = streakInfo(writtenDays(entries), today)
  // Points de la liste (intégrée + deck) déjà bien employés d'après les corrections.
  const good = goodPoints(entries)
  const own = activeLibrary(library).grammar
  const candidates = [...own, ...GRAMMAR]
  const placed = candidates.filter((g) => timesUsed(g.pattern, good) > 0).length

  return (
    <section className="page">
      <header className="page-header">
        <h1>Historique</h1>
        <p className="muted">
          {entries.length === 0
            ? 'Aucune entrée pour le moment. Écris la première dans l’onglet Écrire.'
            : `${entries.length} entrée${entries.length > 1 ? 's' : ''}`}
        </p>
        {entries.length > 0 && (
          <p className="muted stats-line">
            Série : {streak.current} jour{streak.current > 1 ? 's' : ''} · record :{' '}
            {streak.best}
            {good.length > 0 && ` · grammaire bien placée : ${placed} point${placed > 1 ? 's' : ''}`}
          </p>
        )}
      </header>

      <ul className="entry-list">
        {entries.map((entry) => {
          const open = entry.id === openId
          return (
            <li key={entry.id} className="entry">
              <button
                className="entry-head"
                onClick={() => setOpenId(open ? null : entry.id)}
                aria-expanded={open}
              >
                <span lang="ja" className="entry-date date-ink">
                  {formatDateJa(entry.id, entry.id.slice(0, 4) !== thisYear)}
                </span>
                <span className="entry-meta">
                  {entry.correction && (
                    <span lang="ja" className="red-ink entry-mark">
                      添削
                    </span>
                  )}
                  <span className="entry-count">{countChars(entry.text)} 文字</span>
                </span>
              </button>
              {!open && (
                <p lang="ja" className="entry-preview">
                  {entry.text}
                </p>
              )}
              {open && (
                <div className="entry-body">
                  {entry.prompt && (
                    <p lang="ja" className="entry-topic blue-ink">
                      お題：<Jp text={entry.prompt.topic.ja} furigana={settings.furiganaFrom} />
                      <span className="fr"> ・ {entry.prompt.grammar.pattern}</span>
                    </p>
                  )}
                  <p lang="ja" className="sheet entry-text">
                    {entry.text}
                  </p>
                  {entry.correction && (
                    <CorrectionView
                      correction={entry.correction}
                      furigana={settings.furiganaFrom}
                      stale={entry.correction.sourceText !== entry.text}
                    />
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
    </section>
  )
}
