import { useRef, useState } from 'react'
import { loadQuizHistory, saveQuizHistory } from '../db'
import { Jp } from '../furigana'
import { buildQuiz, collectItems, type QuizHistory, type QuizQuestion } from '../quiz'
import type { Entry, FuriganaFrom } from '../types'

interface Props {
  entries: Entry[]
  furigana: FuriganaFrom
}

const KIND_FR: Record<string, string> = {
  particule: 'Particule',
  conjugaison: 'Conjugaison',
  vocabulaire: 'Vocabulaire',
  grammaire: 'Grammaire',
  registre: 'Registre',
  orthographe: 'Orthographe',
  naturel: 'Plus naturel',
}

const MIN_ITEMS = 3

/** Mini-quiz : on te montre ta phrase fautive, tu retrouves la bonne forme. */
export default function ErrorQuiz({ entries, furigana }: Props) {
  const items = collectItems(entries)
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState<QuizQuestion[]>([])
  const history = useRef<QuizHistory>({})

  async function start() {
    history.current = await loadQuizHistory().catch(() => ({}))
    setQuestions(buildQuiz(items, history.current, 5))
    setIndex(0)
    setPicked(null)
    setScore(0)
    setMissed([])
  }

  async function answer(q: QuizQuestion, option: string) {
    if (picked !== null) return
    const right = option === q.item.correctPlain
    setPicked(option)
    if (right) setScore((s) => s + 1)
    else setMissed((m) => [...m, q])
    const h = history.current[q.item.key] ?? { right: 0, wrong: 0, last: 0 }
    history.current = {
      ...history.current,
      [q.item.key]: {
        right: h.right + (right ? 1 : 0),
        wrong: h.wrong + (right ? 0 : 1),
        last: Date.now(),
      },
    }
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
  const good = picked === q.item.correctPlain
  return (
    <>
      {heading}
      <div className="quiz">
        <p className="fr quiz-count">
          Question {index + 1} sur {questions.length} · {KIND_FR[q.item.kind] ?? q.item.kind}
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
                  onClick={() => void answer(q, o)}
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
            <div className="actions">
              <button
                type="button"
                className="sketch primary"
                onClick={() => {
                  setIndex(index + 1)
                  setPicked(null)
                }}
              >
                {index + 1 >= questions.length ? 'Voir le résultat' : 'Suivante'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
