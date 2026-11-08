import { useRef, useState } from 'react'
import { loadQuizHistory, saveQuizHistory } from '../db'
import { Jp } from '../furigana'
import { buildQuiz, collectItems, recordAnswer, type QuizHistory, type QuizQuestion } from '../quiz'
import QuizCard from './QuizCard'
import type { Entry, FuriganaFrom } from '../types'

interface Props {
  entries: Entry[]
  furigana: FuriganaFrom
}

const MIN_ITEMS = 3

/** Mini-quiz : on te montre ta phrase fautive, tu retrouves la bonne forme. */
export default function ErrorQuiz({ entries, furigana }: Props) {
  const items = collectItems(entries)
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState<QuizQuestion[]>([])
  const history = useRef<QuizHistory>({})

  async function start() {
    history.current = await loadQuizHistory().catch(() => ({}))
    setQuestions(buildQuiz(items, history.current, 5))
    setIndex(0)
    setScore(0)
    setMissed([])
  }

  async function answer(q: QuizQuestion, right: boolean) {
    if (right) setScore((s) => s + 1)
    else setMissed((m) => [...m, q])
    history.current = recordAnswer(history.current, q.item.key, right)
    await saveQuizHistory(history.current).catch(() => undefined)
  }

  const heading = (
    <h2 className="part">
      <span lang="ja">復習</span>
      <span className="fr">Revoir mes erreurs</span>
    </h2>
  )

  if (items.length < MIN_ITEMS) {
    return (
      <>
        {heading}
        <p className="fr empty">
          Le quiz se débloque avec {MIN_ITEMS} erreurs corrigées (il y en a {items.length}
          pour l'instant).
        </p>
      </>
    )
  }

  if (!questions) {
    return (
      <>
        {heading}
        <p className="fr empty">
          5 questions tirées de tes propres fautes, celles qui reviennent le plus en premier.
        </p>
        <div className="actions">
          <button type="button" className="sketch primary" onClick={() => void start()}>
            Lancer le mini-quiz
          </button>
        </div>
      </>
    )
  }

  const done = index >= questions.length
  if (done) {
    return (
      <>
        {heading}
        <div className="quiz">
          <p className="quiz-score green-ink">
            {score} / {questions.length}
          </p>
          {missed.length > 0 && (
            <>
              <h3 className="sub fr">À retenir</h3>
              <ul className="review-list">
                {missed.map((q) => (
                  <li key={q.item.key}>
                    <p className="fix-line" lang="ja">
                      <del className="fix-original">{q.item.original}</del>
                      <span className="fix-arrow" aria-hidden="true">
                        →
                      </span>
                      <span className="red-ink">
                        <Jp text={q.item.corrected} furigana={furigana} />
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="actions quiz-actions">
            <button type="button" className="sketch primary" onClick={() => void start()}>
              Encore 5 questions
            </button>
            <button type="button" className="sketch" onClick={() => setQuestions(null)}>
              Fermer
            </button>
          </div>
        </div>
      </>
    )
  }

  const q = questions[index]
  return (
    <>
      {heading}
      <QuizCard
        key={`${index}-${q.item.key}`}
        question={q}
        furigana={furigana}
        caption={`Question ${index + 1} sur ${questions.length}`}
        onAnswer={(right) => void answer(q, right)}
        nextLabel={index + 1 >= questions.length ? 'Voir le résultat' : 'Suivante'}
        onNext={() => setIndex(index + 1)}
      />
    </>
  )
}
