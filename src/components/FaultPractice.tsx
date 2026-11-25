import { useState } from 'react'
import { faultLink, faultSeries } from '../faultPractice'
import { loadQuizHistory, saveQuizHistory } from '../db'
import { recordAnswer, type QuizHistory, type QuizQuestion } from '../quiz'
import type { CorrectionItem, FuriganaFrom } from '../types'
import QuizCard from './QuizCard'

interface Props {
  error: CorrectionItem
  sourceText: string
  furigana: FuriganaFrom
}

/**
 * Sous une faute : « S'entraîner » ouvre trois petites questions sur le même point (S8.3).
 * Pas de bouton quand aucun exercice n'est lié. Rien ne compte dans les statistiques d'écriture.
 */
export default function FaultPractice({ error, sourceText, furigana }: Props) {
  const link = faultLink(error, sourceText)
  const [questions, setQuestions] = useState<QuestionsState>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [history, setHistory] = useState<QuizHistory>({})
  if (!link) return null

  async function start() {
    const h = await loadQuizHistory().catch(() => ({}) as QuizHistory)
    setHistory(h)
    setQuestions(faultSeries(link!, error, sourceText, h))
    setIndex(0)
    setScore(0)
  }

  async function answer(q: QuizQuestion, right: boolean) {
    if (right) setScore((s) => s + 1)
    const next = recordAnswer(history, q.item.key, right)
    setHistory(next)
    await saveQuizHistory(next).catch(() => undefined)
  }

  if (!questions) {
    return (
      <p className="fix-practice">
        <button type="button" className="sketch fr" onClick={() => void start()}>
          S'entraîner
        </button>
      </p>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="fix-practice quiz">
        <p className="fr muted">Plus de question sur ce point pour l'instant.</p>
        <div className="actions quiz-actions">
          <button type="button" className="sketch fr" onClick={() => setQuestions(null)}>
            Fermer
          </button>
        </div>
      </div>
    )
  }

  if (index >= questions.length) {
    return (
      <div className="fix-practice quiz">
        <p className="quiz-score green-ink">
          {score} / {questions.length}
        </p>
        <div className="actions quiz-actions">
          <button type="button" className="sketch primary fr" onClick={() => void start()}>
            Encore 3 questions
          </button>
          <button type="button" className="sketch fr" onClick={() => setQuestions(null)}>
            Fermer
          </button>
        </div>
      </div>
    )
  }

  const q = questions[index]
  return (
    <div className="fix-practice">
      <QuizCard
        key={`${index}-${q.item.key}`}
        question={q}
        furigana={furigana}
        prompt={q.item.kind === 'particule' ? 'Quelle particule ?' : undefined}
        caption={`Question ${index + 1} sur ${questions.length}`}
        onAnswer={(right) => void answer(q, right)}
        nextLabel={index + 1 >= questions.length ? 'Voir le résultat' : 'Suivante'}
        onNext={() => setIndex(index + 1)}
      />
    </div>
  )
}

type QuestionsState = QuizQuestion[] | null
