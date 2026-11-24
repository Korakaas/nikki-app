import { useCallback, useEffect, useState } from 'react'
import { loadAnki, listEntries, loadTwoMinutesDay, todayId } from '../db'
import { deckVerbs } from '../conj/verbs'
import { writtenDays } from '../stats'
import Stamp from '../components/Stamp'
import Chevron from '../components/Chevron'
import ConjSection from '../components/ConjSection'
import ErrorQuiz from '../components/ErrorQuiz'
import MixedSeries from '../components/MixedSeries'
import ParticleDrill from '../components/ParticleDrill'
import TransitivityDrill from '../components/TransitivityDrill'
import type { AnkiLibrary, Entry, Settings } from '../types'

/** Onglet Exercices : « J'ai 2 minutes » en tête, puis quiz d'erreurs, particules, conjugaison et transitivité (avant dans Stats). */
interface Props {
  settings: Settings
}

export default function PracticePage({ settings }: Props) {
  const [mixed, setMixed] = useState(false)
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [library, setLibrary] = useState<AnkiLibrary | null>(null)
  // Une série « J'ai 2 minutes » a été terminée aujourd'hui (jamais en retard ni en rouge : juste une coche).
  const [seriesDone, setSeriesDone] = useState(false)

  const refreshSeriesDone = useCallback(() => {
    void loadTwoMinutesDay()
      .then((d) => setSeriesDone(d === todayId()))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    void listEntries().then(setEntries)
    void loadAnki()
      .then(setLibrary)
      .catch(() => setLibrary(null))
    refreshSeriesDone()
  }, [refreshSeriesDone])

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
          onClose={() => {
            setMixed(false)
            refreshSeriesDone()
          }}
        />
      </section>
    )
  }

  return (
    <section className="page stats practice">
      <header className="page-header">
        <h1>Exercices</h1>
      </header>
      <button type="button" className="two-min-card" onClick={() => setMixed(true)}>
        <span className="two-min-key" lang="ja" aria-hidden="true">
          二分
        </span>
        <span className="two-min-text">
          <span className="two-min-name fr">
            J'ai 2 minutes
          </span>
          <small className="fr">
            {seriesDone ? "Fait aujourd'hui · encore 5 questions ?" : '5 questions, sans réglage'}
          </small>
        </span>
        {seriesDone ? <Stamp kind="nibun" size={62} tilt={-6} /> : <Chevron dir="right" size={22} />}
      </button>
      <div className="block">
        <ParticleDrill entries={entries} furigana={settings.furiganaFrom} />
      </div>
      <div className="block">
        <ConjSection library={library} />
      </div>
      <div className="block">
        <TransitivityDrill entries={entries} furigana={settings.furiganaFrom} deck={deckSet} />
      </div>
      {/* « Revoir mes erreurs » est en dernier : il reste verrouillé tant qu'il y a moins de 3 erreurs corrigées. */}
      <div className="block">
        <ErrorQuiz entries={entries} furigana={settings.furiganaFrom} />
      </div>
    </section>
  )
}
