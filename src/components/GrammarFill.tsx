import { useEffect, useRef, useState } from 'react'
import { loadAnki, loadFillDay, loadQuizHistory, loadReviews, saveFillDay, saveQuizHistory, todayId } from '../db'
import { Jp } from '../furigana'
import { checkFill, dailyFill, fillPool, isDue, type FillQuestion } from '../grammarFill'
import { recordAnswer, type QuizHistory } from '../quiz'
import { difficultyOf, type Settings } from '../types'
import Block, { Pill } from './Block'

interface Props {
  settings: Settings
}

type Phase = 'card' | 'run' | 'end'

/**
 * Point du jour (S8.1a) : trois phrases à trous à écrire au clavier japonais.
 * Aucun appel à l'API. Rien n'est noté : une erreur montre la bonne forme et reviendra un autre jour (S8.1b) ;
 * « Passer » n'enregistre rien.
 */
export default function GrammarFill({ settings }: Props) {
  const [pool, setPool] = useState<FillQuestion[] | null>(null)
  const [questions, setQuestions] = useState<FillQuestion[]>([])
  const [done, setDone] = useState(false)
  const [phase, setPhase] = useState<Phase>('card')
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [hinted, setHinted] = useState(false)
  const [result, setResult] = useState<boolean | null>(null)
  const [empty, setEmpty] = useState(false)
  const [missed, setMissed] = useState<FillQuestion[]>([])
  const [due, setDue] = useState<Set<string>>(() => new Set())
  const history = useRef<QuizHistory>({})
  const usedToday = useRef<string[]>([])
  const rounds = useRef(0)
  const input = useRef<HTMLInputElement>(null)
  const today = todayId()
  const difficulty = difficultyOf(settings)

  useEffect(() => {
    let alive = true
    void (async () => {
      const [library, reviews, saved] = await Promise.all([
        loadAnki().catch(() => null),
        loadReviews().catch(() => []),
        loadFillDay().catch(() => null),
      ])
      history.current = await loadQuizHistory().catch(() => ({}))
      const all = fillPool(difficulty, library, reviews[0]?.focus ?? null)
      const now = Date.now()
      let chosen: FillQuestion[] = []
      let isDone = false
      if (saved && saved.day === today) {
        chosen = saved.keys.map((k) => all.find((q) => q.key === k)).filter((q): q is FillQuestion => Boolean(q))
        isDone = saved.done
      }
      if (chosen.length === 0) {
        chosen = dailyFill(today, all, history.current, now)
        void saveFillDay({ day: today, keys: chosen.map((q) => q.key), done: false }).catch(() => undefined)
      }
      if (!alive) return
      usedToday.current = chosen.map((q) => q.key)
      setDue(new Set(all.filter((q) => isDue(q, history.current, now)).map((q) => q.key)))
      setPool(all)
      setQuestions(chosen)
      setDone(isDone)
    })()
    return () => {
      alive = false
    }
  }, [today, difficulty])

  const q = questions[index]
  useEffect(() => {
    if (phase === 'run' && q && result === null) input.current?.focus()
  }, [phase, index, q, result])

  if (!pool) return null
  if (questions.length === 0) return null

  function start(list: FillQuestion[]) {
    setQuestions(list)
    setIndex(0)
    setTyped('')
    setHinted(false)
    setResult(null)
    setEmpty(false)
    setMissed([])
    setPhase('run')
  }

  async function finish() {
    setPhase('end')
    if (!done) {
      setDone(true)
      await saveFillDay({ day: today, keys: usedToday.current.slice(0, 3), done: true }).catch(() => undefined)
    }
  }

  function advance() {
    setResult(null)
    setTyped('')
    setHinted(false)
    setEmpty(false)
    if (index + 1 >= questions.length) void finish()
    else setIndex(index + 1)
  }

  function check() {
    if (!q || result !== null) return
    if (typed.trim() === '') {
      setEmpty(true)
      return
    }
    const good = checkFill(q, typed)
    setResult(good)
    // Avec l'indice, une bonne réponse compte comme « à revoir » : le point reviendra.
    const right = good && !hinted
    if (!right) setMissed((m) => [...m, q])
    history.current = recordAnswer(history.current, q.key, right)
    void saveQuizHistory(history.current).catch(() => undefined)
  }

  function again() {
    rounds.current += 1
    const next = dailyFill(today, pool ?? [], history.current, Date.now(), 3, `#again${rounds.current}`, usedToday.current)
    if (next.length === 0) {
      setPhase('card')
      return
    }
    usedToday.current = [...usedToday.current, ...next.map((x) => x.key)]
    start(next)
  }

  const heading = { role: 'train' as const, ja: '練', title: 'Point du jour' }

  if (phase === 'card') {
    return (
      <Block {...heading}>
        <p className="fill-lead fr">
          {done ? "Fait aujourd'hui. Encore 3 phrases ?" : '3 phrases à compléter au clavier japonais.'}
        </p>
        <div className="actions quiz-actions">
          <button
            type="button"
            className="sketch primary"
            onClick={() => (done ? again() : start(questions))}
          >
            {done ? 'Encore 3 phrases' : 'Commencer'}
          </button>
        </div>
      </Block>
    )
  }

  if (phase === 'end') {
    return (
      <Block {...heading}>
        <p className="fill-title fr">Terminé pour aujourd'hui.</p>
        {missed.length > 0 && (
          <>
            <h3 className="sub fr">À retenir</h3>
            <ul className="review-list">
              {missed.map((m) => (
                <li key={m.key}>
                  <p lang="ja">
                    <Jp text={m.full} furigana={settings.furiganaFrom} />
                  </p>
                  <p className="fix-why fr">
                    {m.pattern} : {m.meaning}
                  </p>
                </li>
              ))}
            </ul>
            <p className="fix-why fr">Ces points reviendront un autre jour, sans note.</p>
          </>
        )}
        <div className="actions quiz-actions">
          <button type="button" className="sketch primary" onClick={again}>
            Encore 3 phrases
          </button>
          <button type="button" className="sketch" onClick={() => setPhase('card')}>
            Fermer
          </button>
        </div>
      </Block>
    )
  }

  const label = index === 0 ? 'Du jour' : due.has(q.key) ? 'À revoir' : 'Autre point'
  const answer = q.answers[0]

  return (
    <Block {...heading}>
      <div className="fill-top">
        <Pill role="write">{label}</Pill>
        <span className="fill-step fr">
          Phrase {index + 1} sur {questions.length}
        </span>
      </div>
      <div className="fill-point">
        <span className="fill-level">{q.level}</span>
        <span className="fr">{q.meaning}</span>
      </div>
      <p className="fill-frame" lang="ja">
        <Jp text={q.frame} furigana={settings.furiganaFrom} />
      </p>
      <p className="fill-fr fr">{q.fr}</p>
      {hinted && result === null && (
        <p className="fill-hint fr">
          Le point : <span lang="ja">{q.pattern}</span>
        </p>
      )}
      <input
        ref={input}
        className="fill-input"
        type="text"
        lang="ja"
        value={typed}
        placeholder="Écris la réponse"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={result !== null}
        aria-label="Réponse"
        onChange={(e) => {
          setTyped(e.target.value)
          setEmpty(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (result === null) check()
            else advance()
          }
        }}
      />
      {empty && (
        <p className="problem fr" role="alert">
          Écris une réponse, ou touche Passer.
        </p>
      )}
      {result !== null && (
        <div className="fill-feedback fr" role="status">
          <p>
            {result ? 'Bien joué : ' : 'Pas tout à fait. La forme attendue : '}
            <span lang="ja">{answer}</span>
          </p>
          <p lang="ja" className="fill-full">
            <Jp text={q.full} furigana={settings.furiganaFrom} />
          </p>
        </div>
      )}
      <div className="actions quiz-actions">
        {result === null ? (
          <>
            <button type="button" className="sketch primary" onClick={check}>
              Vérifier
            </button>
            {!hinted && (
              <button type="button" className="sketch" onClick={() => setHinted(true)}>
                Indice
              </button>
            )}
            <button type="button" className="sketch" onClick={advance}>
              Passer
            </button>
          </>
        ) : (
          <button type="button" className="sketch primary" onClick={advance}>
            {index + 1 >= questions.length ? 'Terminer' : 'Suivante'}
          </button>
        )}
      </div>
      <p className="muted fr fill-note">Kanji ou kana, les deux sont acceptés. Rien n'est noté.</p>
    </Block>
  )
}
