import { useEffect, useRef, useState } from 'react'
import { listEntries, loadQuizHistory, saveQuizHistory } from '../db'
import { Jp, plainText } from '../furigana'
import { buildQuiz, collectItems, recordAnswer, type QuizHistory, type QuizQuestion } from '../quiz'
import type { BonusSentence, FuriganaFrom } from '../types'
import QuizCard from './QuizCard'

/** Une phrase de plus à ajouter à l'entrée, proposée par Claude avec la correction. */
export function BonusCard({
  bonus,
  furigana,
  text,
  onAdd,
}: {
  bonus: BonusSentence
  furigana: FuriganaFrom
  /** Texte actuel de l'entrée : la carte se range une fois la phrase ajoutée. */
  text: string
  onAdd: (sentence: string) => void
}) {
  const sentence = plainText(bonus.ja).trim()
  const added = text.includes(sentence)
  return (
    <section className="after-card bonus" aria-label="Phrase bonus">
      <h2 className="part">
        <span lang="ja">もう一文</span>
        <span className="fr">Phrase bonus</span>
      </h2>
      <p className="bonus-ja blue-ink" lang="ja">
        <Jp text={bonus.ja} furigana={furigana} />
      </p>
      <p className="fr note-fr">{bonus.fr}</p>
      {bonus.why && <p className="fr bonus-why">{bonus.why}</p>}
      <div className="actions">
        {added ? (
          <span className="fr green-ink">Ajoutée à ton entrée ✓</span>
        ) : (
          <button type="button" className="sketch" onClick={() => onAdd(sentence)}>
            Ajouter à mon entrée
          </button>
        )}
      </div>
    </section>
  )
}

/** Une question tirée de tes fautes passées (pas de celles d'aujourd'hui), juste après la correction. */
export function QuickReview({
  currentId,
  correctionKey,
  furigana,
}: {
  currentId: string
  /** Change à chaque nouvelle correction : une nouvelle question est tirée. */
  correctionKey: number
  furigana: FuriganaFrom
}) {
  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const history = useRef<QuizHistory>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const all = await listEntries()
      const here = new Set(collectItems(all.filter((e) => e.id === currentId)).map((i) => i.key))
      const items = collectItems(all.filter((e) => e.id !== currentId)).filter((i) => !here.has(i.key))
      if (items.length < 2) return
      history.current = await loadQuizHistory().catch(() => ({}))
      if (!cancelled) setQuestion(buildQuiz(items, history.current, 1)[0] ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [currentId, correctionKey])

  if (!question) return null
  return (
    <section className="after-card" aria-label="Révision éclair">
      <h2 className="part">
        <span lang="ja">復習</span>
        <span className="fr">Révision éclair</span>
      </h2>
      <QuizCard
        key={question.item.key}
        question={question}
        furigana={furigana}
        onAnswer={(right) => {
          history.current = recordAnswer(history.current, question.item.key, right)
          void saveQuizHistory(history.current).catch(() => undefined)
        }}
      />
    </section>
  )
}
