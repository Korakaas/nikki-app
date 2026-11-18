import { useEffect, useState } from 'react'
import { loadAnki, listEntries } from '../db'
import { deckVerbs } from '../conj/verbs'
import { writtenDays } from '../stats'
import ConjSection from '../components/ConjSection'
import ErrorQuiz from '../components/ErrorQuiz'
import ParticleDrill from '../components/ParticleDrill'
import TransitivityDrill from '../components/TransitivityDrill'
import type { AnkiLibrary, Entry, Settings } from '../types'

/** Onglet Exercices : quiz d'erreurs, particules, conjugaison et transitivité (avant dans Stats). */
export default function PracticePage({ settings }: { settings: Settings }) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [library, setLibrary] = useState<AnkiLibrary | null>(null)

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

  return (
    <section className="page stats practice">
      <header className="page-header">
        <h1>Exercices</h1>
      </header>
      <ErrorQuiz entries={entries} furigana={settings.furiganaFrom} />
      <ParticleDrill entries={entries} furigana={settings.furiganaFrom} />
      <ConjSection library={library} />
      <TransitivityDrill entries={entries} furigana={settings.furiganaFrom} deck={deckSet} />
    </section>
  )
}
