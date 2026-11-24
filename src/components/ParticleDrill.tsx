import { useRef, useState } from 'react'
import { loadQuizHistory, saveQuizHistory } from '../db'
import { buildParticleDrill, ownParticleCount } from '../particles'
import { hideItem, recordAnswer, type QuizHistory, type QuizQuestion } from '../quiz'
import type { Entry, FuriganaFrom } from '../types'
import QuizCard from './QuizCard'
import { BlockTitle } from './Block'

interface Props {
  entries: Entry[]
  furigana: FuriganaFrom
}

/** Dix questions « quelle particule ? » : tes erreurs d'abord, puis les verbes à particule fixe. */
export default function ParticleDrill({ entries, furigana }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState<QuizQuestion[]>([])
  const history = useRef<QuizHistory>({})
  const own = ownParticleCount(entries)

  async function start() {
    history.current = await loadQuizHistory().catch(() => ({}))
    setQuestions(buildParticleDrill(entries, history.current, 10))
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

  async function hide(q: QuizQuestion) {
    history.current = hideItem(history.current, q.item.key)
    setQuestions((qs) => qs?.filter((x) => x.item.key !== q.item.key) ?? null)
    await saveQuizHistory(history.current).catch(() => undefined)
  }

  const heading = <BlockTitle role="train" ja="助詞">Particules</BlockTitle>

  if (!questions) {
    return (
      <>
        {heading}
        <p className="fr empty">
          10 questions « quelle particule ? »{' '}
          {own > 0
            ? `: ${own} viennent de tes propres fautes, le reste est une liste de verbes à particule fixe.`
            : ': une liste de verbes à particule fixe (tes fautes de particule s’y ajouteront).'}
        </p>
        <div className="actions">
          <button type="button" className="sketch primary" onClick={() => void start()}>
            Lancer les exercices
          </button>
        </div>
      </>
    )
  }

  if (index >= questions.length) {
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
                    <p lang="ja">{(q.item.context ?? '').replace('＿＿＿', `【${q.item.correctPlain}】`)}</p>
                    {q.item.explanation && <p className="fix-why fr">{q.item.explanation}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="actions quiz-actions">
            <button type="button" className="sketch primary" onClick={() => void start()}>
              Encore 10 questions
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
        prompt="Quelle particule ?"
        caption={`Question ${index + 1} sur ${questions.length}`}
        onAnswer={(right) => void answer(q, right)}
        onHide={() => void hide(q)}
        nextLabel={index + 1 >= questions.length ? 'Voir le résultat' : 'Suivante'}
        onNext={() => setIndex(index + 1)}
      />
    </>
  )
}
