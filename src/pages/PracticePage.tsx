import { useEffect, useState } from 'react'
import { loadAnki, listEntries } from '../db'
import { deckVerbs } from '../conj/verbs'
import { writtenDays } from '../stats'
import ConjSection from '../components/ConjSection'
import ErrorQuiz from '../components/ErrorQuiz'
import MixedSeries from '../components/MixedSeries'
import ParticleDrill from '../components/ParticleDrill'
import TransitivityDrill from '../components/TransitivityDrill'
import type { AnkiLibrary, Entry, Settings } from '../types'

/** Onglet Exercices : quiz d'erreurs, particules, conjugaison et transitivité (avant dans Stats). */
interface Props {
  settings: Settings
  /** Lance tout de suite la série « J'ai 2 minutes » (depuis la carte « Aujourd'hui »). */
  autostart?: boolean
  onAutostartDone?: () => void
}

export default function PracticePage({ settings, autostart, onAutostartDone }: Props) {
  const [mixed, setMixed] = useState(false)
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [library, setLibrary] = useState<AnkiLibrary | null>(null)

  useEffect(() => {
    if (autostart) {
      setMixed(true)
      onAutostartDone?.()
    }
  }, [autostart, onAutostartDone])

  useEffect(() => {
    void listEntries().then(setEntries)
    void loadAnki()
      .then(setLibrary)
      .catch(() => setLibrary(null))
  }, [])

  if (!entries) return null

  if (writtenDays(entries).size === 0) {
    return (
      <section className="page">
        <header className="page-header">
          <h1>Exercices</h1>
          <p className="muted">Écris une première entrée : les exercices apparaîtront ici.</p>
        </header>
      </section>
    )
  }

  const deckSet = new Set(deckVerbs(library).map((v) => v.ja))

  if (mixed) {
    return (
      <section className="page stats practice">
        <MixedSeries
          entries={entries}
          library={library}
          furigana={settings.furiganaFrom}
          deck={deckSet}
          onClose={() => setMixed(false)}
        />
      </section>
    )
  }

  return (
    <section className="page stats practice">
      <header className="page-header">
        <h1>Exercices</h1>
      </header>
      <ErrorQuiz entries={entries} furigana={settings.furiganaFrom} />
      <ParticleDrill entries={entries} furigana={settings.furiganaFrom} />
      <ConjSection library={library} />
      <TransitivityDrill entries={entries} furigana={settings.furiganaFrom} deck={deckSet} />
      <div className="two-min-bar">
        <button type="button" className="sketch primary two-min" onClick={() => setMixed(true)}>
          <span lang="ja">二分</span> J'ai 2 minutes · 5 questions
        </button>
      </div>
    </section>
  )
}
