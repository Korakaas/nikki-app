import { useEffect, useMemo, useRef, useState } from 'react'
import { loadQuizHistory, saveQuizHistory } from '../db'
import { Jp } from '../furigana'
import { hideItem, recordAnswer, type QuizHistory, type QuizQuestion } from '../quiz'
import {
  buildTransitivityDrill,
  buildWrittenDrill,
  checkWritten,
  label,
  PAIRS,
  transitivityLinks,
  type WrittenQuestion,
} from '../transitivity'
import type { Entry, FuriganaFrom } from '../types'
import QuizCard from './QuizCard'
import { BlockTitle } from './Block'

interface Props {
  entries: Entry[]
  furigana: FuriganaFrom
  /** Verbes de ton deck (pour les proposer un peu plus souvent). */
  deck: Set<string>
}

const heading = <BlockTitle role="train" ja="自他">Transitif ou intransitif</BlockTitle>

/** Série écrite : on te donne la phrase (la tienne, si tu t'es trompée), tu tapes le verbe. */
function WrittenSeries({
  questions,
  furigana,
  onClose,
  onAgain,
}: {
  questions: WrittenQuestion[]
  furigana: FuriganaFrom
  onClose: () => void
  onAgain: () => void
}) {
  const [list, setList] = useState(questions)
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [hinted, setHinted] = useState(false)
  const [result, setResult] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState<WrittenQuestion[]>([])
  const history = useRef<QuizHistory>({})
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadQuizHistory()
      .catch(() => ({}))
      .then((h) => {
        history.current = h
      })
  }, [])
  const q = list[index]
  useEffect(() => {
    if (q && result === null) input.current?.focus()
  }, [index, q, result])

  async function save(next: QuizHistory) {
    history.current = next
    await saveQuizHistory(next).catch(() => undefined)
  }

  function submit(raw: string) {
    if (!q || result !== null) return
    // Avec l'indice, une bonne réponse compte comme à revoir : la question reviendra.
    const right = checkWritten(q, raw) && !hinted
    setResult(checkWritten(q, raw))
    if (right) setScore((s) => s + 1)
    else setMissed((m) => [...m, q])
    void save(recordAnswer(history.current, q.key, right))
  }

  function next() {
    setResult(null)
    setTyped('')
    setHinted(false)
    setIndex((i) => i + 1)
  }

  async function hide() {
    if (!q) return
    await save(hideItem(history.current, q.key))
    setList((l) => l.filter((x) => x.key !== q.key))
    setResult(null)
    setTyped('')
    setHinted(false)
  }

  if (index >= list.length) {
    return (
      <>
        {heading}
        <div className="quiz">
          <p className="quiz-score green-ink">
            {score} / {list.length}
          </p>
          {missed.length > 0 && (
            <>
              <h3 className="sub fr">À retenir</h3>
              <ul className="review-list">
                {missed.map((m) => (
                  <li key={m.key}>
                    <p lang="ja">{m.frame.replace('＿＿＿', `【${m.answers[0]}】`)}</p>
                    {m.fr && <p className="fix-why fr">{m.fr}</p>}
                    <p className="fix-why fr">{m.explanation}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="actions quiz-actions">
            <button type="button" className="sketch primary" onClick={onAgain}>
              Encore 10 phrases
            </button>
            <button type="button" className="sketch" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {heading}
      <div className="quiz conj-card">
        <p className="fr quiz-count">
          {`Phrase ${index + 1} sur ${list.length}`}
          {q.own ? ' · tirée de tes fautes' : ''}
        </p>
        <p className="quiz-prompt fr">Écris le verbe qui convient</p>
        <p className="quiz-sentence" lang="ja">
          {q.frame}
        </p>
        {q.fr && <p className="fr conj-meaning">{q.fr}</p>}
        {hinted && result === null && (
          <p className="fr" lang="ja">
            Indice : {label(q.pair.intr, q.pair.intrReading)} ou {label(q.pair.tr, q.pair.trReading)}
          </p>
        )}
        <form
          className="conj-form"
          onSubmit={(e) => {
            e.preventDefault()
            submit(typed)
          }}
        >
          <input
            ref={input}
            className="conj-input"
            lang="ja"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="réponse en japonais"
            aria-label="Ta réponse en japonais"
            value={typed}
            readOnly={result !== null}
            onChange={(e) => setTyped(e.target.value)}
          />
          {result === null && (
            <div className="actions quiz-actions">
              <button type="submit" className="sketch primary" disabled={typed.trim() === ''}>
                Vérifier
              </button>
              {!hinted && (
                <button type="button" className="sketch" onClick={() => setHinted(true)}>
                  Indice
                </button>
              )}
              <button type="button" className="sketch" onClick={() => submit('')}>
                Je ne sais pas
              </button>
            </div>
          )}
        </form>
        {result !== null && (
          <div className="quiz-result">
            <p className={result && !hinted ? 'green-ink' : 'red-ink'}>
              <span lang="fr">
                {result ? (hinted ? 'Juste, mais avec l’indice : à revoir.' : 'Bien joué !') : 'Pas tout à fait.'}
              </span>
            </p>
            <p lang="ja" className="conj-expected">
              <Jp text={q.display} furigana={furigana} />
            </p>
            <p className="fix-why fr">{q.explanation}</p>
            <div className="actions">
              <button type="button" className="sketch primary" autoFocus onClick={next}>
                {index + 1 >= list.length ? 'Voir le résultat' : 'Suivante'}
              </button>
            </div>
            <p className="fr quiz-hide">
              <button type="button" className="link" onClick={() => void hide()}>
                Retirer cette question
              </button>
            </p>
          </div>
        )}
        {result === null && (
          <p className="fr quiz-hide">
            <button type="button" className="link" onClick={onClose}>
              Quitter la série
            </button>
          </p>
        )}
      </div>
    </>
  )
}

/** Exercices sur les paires 自動詞 / 他動詞 : en écrivant le verbe, ou en choisissant. */
export default function TransitivityDrill({ entries, furigana, deck }: Props) {
  const [mode, setMode] = useState<'choice' | 'written' | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [written, setWritten] = useState<WrittenQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState<QuizQuestion[]>([])
  const history = useRef<QuizHistory>({})
  const links = useMemo(() => transitivityLinks(entries), [entries])
  const confused = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>()
    for (const l of links) {
      const k = l.pair.intr
      const cur = map.get(k) ?? {
        label: `${label(l.pair.intr, l.pair.intrReading)} ⇄ ${label(l.pair.tr, l.pair.trReading)}`,
        count: 0,
      }
      cur.count++
      map.set(k, cur)
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  }, [links])

  async function start(m: 'choice' | 'written') {
    history.current = await loadQuizHistory().catch(() => ({}))
    setMode(m)
    setIndex(0)
    setScore(0)
    setMissed([])
    if (m === 'written') setWritten(buildWrittenDrill(history.current, deck, links, entries, 10))
    else setQuestions(buildTransitivityDrill(history.current, deck, links, 10))
  }

  function close() {
    setMode(null)
    setQuestions(null)
    setWritten(null)
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

  if (mode === 'written' && written) {
    return (
      <WrittenSeries
        key={written.map((w) => w.key).join()}
        questions={written}
        furigana={furigana}
        onClose={close}
        onAgain={() => void start('written')}
      />
    )
  }

  if (!mode || !questions) {
    return (
      <>
        {heading}
        <p className="fr empty">
          {PAIRS.length} paires de verbes (ouvrir : 開く / 開ける…).
          {links.length > 0 &&
            ` ${links.length} de tes fautes corrigées concernent ces verbes : elles reviennent en priorité.`}
        </p>
        {confused.length > 0 && (
          <ul className="point-list" lang="ja">
            {confused.map((c) => (
              <li key={c.label}>
                <span className="mark red-ink">△</span> {c.label}
                <span className="fr"> — {c.count} correction{c.count > 1 ? 's' : ''}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="actions">
          <button type="button" className="sketch primary" onClick={() => void start('written')}>
            Écrire le verbe
          </button>
          <button type="button" className="sketch" onClick={() => void start('choice')}>
            Choisir le verbe
          </button>
        </div>
        <details className="pair-list">
          <summary className="fr">Astuce et liste des paires</summary>
          <p className="fr">
            Astuce : が + verbe qui se produit tout seul (自動詞), を + verbe où quelqu'un agit (他動詞).
          </p>
          <ul lang="ja">
            {PAIRS.map((p) => (
              <li key={p.intr + p.tr}>
                {label(p.intr, p.intrReading)} <span className="fr">intr.</span> ⇄ {label(p.tr, p.trReading)}{' '}
                <span className="fr">tr.</span>
                <span className="fr">
                  {' '}
                  — {p.intrFr.replace(/\.$/, '')} / {p.trFr.replace(/\.$/, '')}
                </span>
              </li>
            ))}
          </ul>
        </details>
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
                    <p lang="ja">
                      {(q.item.context ?? '').replace('＿＿＿', `【${q.item.correctPlain}】`)}
                      {!q.item.key.endsWith('|c') ? '' : ` → ${q.item.correctPlain}`}
                    </p>
                    {q.item.explanation && <p className="fix-why fr">{q.item.explanation}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="actions quiz-actions">
            <button type="button" className="sketch primary" onClick={() => void start('choice')}>
              Encore 10 questions
            </button>
            <button type="button" className="sketch" onClick={close}>
              Fermer
            </button>
          </div>
        </div>
      </>
    )
  }

  const q = questions[index]
  const classify = q.item.key.endsWith('|c')
  return (
    <>
      {heading}
      <QuizCard
        key={`${index}-${q.item.key}`}
        question={q}
        furigana={furigana}
        prompt={classify ? 'Transitif ou intransitif ?' : 'Quel verbe ?'}
        caption={`Question ${index + 1} sur ${questions.length}`}
        onAnswer={(right) => void answer(q, right)}
        onHide={() => void hide(q)}
        nextLabel={index + 1 >= questions.length ? 'Voir le résultat' : 'Suivante'}
        onNext={() => setIndex(index + 1)}
      />
    </>
  )
}
