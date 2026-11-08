import { useState } from 'react'
import { Jp } from '../furigana'
import type { QuizQuestion } from '../quiz'
import type { FuriganaFrom } from '../types'

export const KIND_FR: Record<string, string> = {
  particule: 'Particule',
  conjugaison: 'Conjugaison',
  vocabulaire: 'Vocabulaire',
  grammaire: 'Grammaire',
  registre: 'Registre',
  orthographe: 'Orthographe',
  naturel: 'Plus naturel',
}

interface Props {
  question: QuizQuestion
  furigana: FuriganaFrom
  /** Appelé une fois, au choix d'une réponse. */
  onAnswer: (right: boolean) => void
  /** Texte du bouton qui suit la réponse ; sans lui, pas de bouton. */
  nextLabel?: string
  onNext?: () => void
  /** Ligne au-dessus de la question (ex. « Question 2 sur 5 »). */
  caption?: string
}

/** Une question « quelle est la bonne forme ? » tirée d'une de tes fautes. */
export default function QuizCard({ question: q, furigana, onAnswer, nextLabel, onNext, caption }: Props) {
  const [picked, setPicked] = useState<string | null>(null)
  const good = picked === q.item.correctPlain

  function choose(option: string) {
    if (picked !== null) return
    setPicked(option)
    onAnswer(option === q.item.correctPlain)
  }

  return (
    <div className="quiz">
      <p className="fr quiz-count">
        {caption ? `${caption} · ` : ''}
        {KIND_FR[q.item.kind] ?? q.item.kind}
      </p>
      <p className="quiz-prompt fr">Quelle est la bonne forme ?</p>
      <p className="quiz-sentence" lang="ja">
        {q.item.context ?? q.item.original}
      </p>
      <ul className="quiz-options" lang="ja">
        {q.options.map((o) => {
          const state =
            picked === null
              ? ''
              : o === q.item.correctPlain
                ? 'right'
                : o === picked
                  ? 'wrong'
                  : 'dim'
          return (
            <li key={o}>
              <button
                type="button"
                className={`quiz-option ${state}`}
                disabled={picked !== null}
                onClick={() => choose(o)}
              >
                {o}
              </button>
            </li>
          )
        })}
      </ul>
      {picked !== null && (
        <div className="quiz-result" lang="ja">
          <p className={good ? 'green-ink' : 'red-ink'}>
            <span lang="fr">{good ? 'Bien joué !' : 'Pas tout à fait.'}</span>{' '}
            <Jp text={q.item.corrected} furigana={furigana} />
          </p>
          {q.item.explanation && (
            <p className="fix-why">
              <Jp text={q.item.explanation} furigana={furigana} />
            </p>
          )}
          {nextLabel && onNext && (
            <div className="actions">
              <button type="button" className="sketch primary" onClick={onNext}>
                {nextLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
