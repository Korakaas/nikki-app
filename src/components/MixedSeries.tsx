import { useEffect, useMemo, useRef, useState } from 'react'
import { conjugate, checkAnswer, explain, formInfo } from '../conj/engine'
import { answerCard, buildSession, cardKey, GROUP_FORM, type ConjState, type SessionItem } from '../conj/srs'
import { deckVerbs } from '../conj/verbs'
import { loadConj, loadQuizHistory, saveConj, saveQuizHistory, saveTwoMinutesDay, todayId } from '../db'
import { fillPlan, MIXED_SIZE, planMixed, type MixedKind } from '../mixed'
import { buildParticleDrill } from '../particles'
import { buildQuiz, collectItems, recentFromDay, recordAnswer, type QuizHistory, type QuizQuestion } from '../quiz'
import { buildTransitivityDrill, transitivityLinks } from '../transitivity'
import type { AnkiLibrary, Entry, FuriganaFrom } from '../types'
import { Jp } from '../furigana'
import { Expected, VerbHead } from './ConjSession'
import QuizCard from './QuizCard'

type Step =
  | { kind: 'errors' | 'particle' | 'transitivity'; question: QuizQuestion }
  | { kind: 'conjugation'; item: SessionItem }

interface Props {
  entries: Entry[]
  library: AnkiLibrary | null
  furigana: FuriganaFrom
  /** Verbes de ton deck (pour les proposer un peu plus souvent). */
  deck: Set<string>
  onClose: () => void
}

/** Une carte de conjugaison à la fois, avec la même réponse écrite que dans l'exercice de conjugaison. */
function ConjStep({
  item,
  caption,
  nextLabel,
  onAnswer,
  onNext,
  onQuit,
}: {
  item: SessionItem
  caption: string
  nextLabel: string
  onAnswer: (right: boolean) => void
  onNext: () => void
  onQuit: () => void
}) {
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const form = item.form as Exclude<SessionItem['form'], 'group'>
  const info = formInfo(form)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit(raw: string) {
    if (result !== null) return
    const right = raw.trim() !== '' && checkAnswer(item.verb, form, raw)
    setResult(right)
    onAnswer(right)
  }

  return (
    <div className="quiz conj-card">
      <p className="fr quiz-count">{caption} · Conjugaison</p>
      <VerbHead verb={item.verb} />
      <p className="quiz-prompt fr">
        Mets-le à la forme <strong lang="ja">{info.ja}</strong> — {info.fr}
      </p>
      <form
        className="conj-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit(typed)
        }}
      >
        <input
          ref={inputRef}
          className="conj-input"
          lang="ja"
          inputMode="text"
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
            <button type="button" className="sketch" onClick={() => submit('')}>
              Je ne sais pas
            </button>
          </div>
        )}
      </form>
      {result !== null && (
        <div className="quiz-result">
          <p className={result ? 'green-ink' : 'red-ink'}>
            <span lang="fr">{result ? 'Bien joué !' : 'Pas tout à fait.'}</span>
          </p>
          <Expected verb={item.verb} form={item.form} />
          <p className="fix-why fr">{explain(item.verb, form)}</p>
          <div className="actions">
            <button type="button" className="sketch primary" autoFocus onClick={onNext}>
              {nextLabel}
            </button>
          </div>
        </div>
      )}
      {result === null && (
        <p className="fr quiz-hide">
          <button type="button" className="link" onClick={onQuit}>
            Quitter la série
          </button>
        </p>
      )}
    </div>
  )
}

/**
 * « J'ai 2 minutes » : 5 questions mélangées (conjugaison, transitif / intransitif, particules),
 * sans aucun réglage. Chaque réponse est gardée tout de suite : quitter ne fait rien perdre.
 */
export default function MixedSeries({ entries, library, furigana, deck, onClose }: Props) {
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [round, setRound] = useState(0)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState<Step[]>([])
  const history = useRef<QuizHistory>({})
  const conjState = useRef<ConjState | null>(null)
  const verbs = useMemo(() => deckVerbs(library), [library])
  const links = useMemo(() => transitivityLinks(entries), [entries])

  useEffect(() => {
    let cancelled = false
    async function build() {
      history.current = await loadQuizHistory().catch(() => ({}))
      conjState.current = verbs.length > 0 ? await loadConj().catch(() => null) : null
      const errorItems = collectItems(entries)
      const pools: Record<MixedKind, Step[]> = {
        // « Revoir mes erreurs » : il faut au moins 3 erreurs corrigées, comme pour le mini-quiz.
        errors:
          errorItems.length >= 3
            ? buildQuiz(errorItems, history.current, MIXED_SIZE, Math.random, Date.now(), recentFromDay(todayId())).map(
                (question) => ({ kind: 'errors' as const, question }),
              )
            : [],
        particle: buildParticleDrill(entries, history.current, MIXED_SIZE).map((question) => ({
          kind: 'particle' as const,
          question,
        })),
        transitivity: buildTransitivityDrill(history.current, deck, links, MIXED_SIZE).map((question) => ({
          kind: 'transitivity' as const,
          question,
        })),
        conjugation: conjState.current
          ? buildSession(conjState.current, verbs, todayId(), 'form', MIXED_SIZE)
              .filter((item) => item.form !== GROUP_FORM)
              .map((item) => ({ kind: 'conjugation' as const, item }))
          : [],
      }
      const available = (Object.keys(pools) as MixedKind[]).filter((k) => pools[k].length > 0)
      const list = fillPlan(planMixed(available), pools)
      if (!cancelled) {
        setSteps(list)
        setIndex(0)
        setScore(0)
        setMissed([])
      }
    }
    void build()
    return () => {
      cancelled = true
    }
    // « round » relance une série.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  // Série terminée : la coche « fait aujourd'hui » apparaît sur la carte de l'écran Écrire.
  const finished = steps !== null && steps.length > 0 && index >= steps.length
  useEffect(() => {
    if (finished) void saveTwoMinutesDay(todayId()).catch(() => undefined)
  }, [finished])

  const heading = (
    <h2 className="part">
      <span lang="ja">二分</span>
      <span className="fr">J'ai 2 minutes</span>
    </h2>
  )

  if (!steps) return <>{heading}</>

  async function answerQuiz(step: Step & { question: QuizQuestion }, right: boolean) {
    if (right) setScore((s) => s + 1)
    else setMissed((m) => [...m, step])
    history.current = recordAnswer(history.current, step.question.item.key, right)
    await saveQuizHistory(history.current).catch(() => undefined)
  }

  async function answerConj(step: Step & { item: SessionItem }, right: boolean) {
    if (right) setScore((s) => s + 1)
    else setMissed((m) => [...m, step])
    const base = conjState.current ?? (await loadConj())
    conjState.current = answerCard(base, cardKey(step.item.verb, step.item.form), right, todayId())
    await saveConj(conjState.current).catch(() => undefined)
  }

  if (steps.length === 0) {
    return (
      <>
        {heading}
        <p className="fr empty">Pas encore assez de matière pour une série. Écris une entrée ou importe ton deck Anki.</p>
        <div className="actions">
          <button type="button" className="sketch" onClick={onClose}>
            Fermer
          </button>
        </div>
      </>
    )
  }

  if (index >= steps.length) {
    return (
      <>
        {heading}
        <div className="quiz">
          <p className="quiz-score green-ink">
            {score} / {steps.length}
          </p>
          {missed.length > 0 && (
            <>
              <h3 className="sub fr">À retenir</h3>
              <ul className="review-list">
                {missed.map((m, i) => (
                  <li key={i}>
                    {m.kind === 'errors' ? (
                      <p className="fix-line" lang="ja">
                        <del className="fix-original">{m.question.item.original}</del>
                        <span className="fix-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="red-ink">
                          <Jp text={m.question.item.corrected} furigana={furigana} />
                        </span>
                      </p>
                    ) : 'question' in m ? (
                      <>
                        <p lang="ja">{(m.question.item.context ?? '').replace('＿＿＿', `【${m.question.item.correctPlain}】`)}</p>
                        {m.question.item.explanation && <p className="fix-why fr">{m.question.item.explanation}</p>}
                      </>
                    ) : (
                      <p lang="ja" className="conj-missed">
                        {m.item.verb.ja}
                        <span className="fix-arrow" aria-hidden="true">
                          {' '}
                          {formInfo(m.item.form as Exclude<SessionItem['form'], 'group'>).ja} →{' '}
                        </span>
                        <span className="red-ink">{conjugate(m.item.verb, m.item.form as Exclude<SessionItem['form'], 'group'>)?.ja}</span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="actions quiz-actions">
            <button type="button" className="sketch primary" onClick={() => { setSteps(null); setRound((r) => r + 1) }}>
              Encore 5 questions
            </button>
            <button type="button" className="sketch" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </>
    )
  }

  const step = steps[index]
  const caption = `Question ${index + 1} sur ${steps.length}`
  const nextLabel = index + 1 >= steps.length ? 'Voir le résultat' : 'Suivante'
  return (
    <>
      {heading}
      {step.kind === 'conjugation' ? (
        <ConjStep
          key={`${index}-${cardKey(step.item.verb, step.item.form)}`}
          item={step.item}
          caption={caption}
          nextLabel={nextLabel}
          onAnswer={(right) => void answerConj(step, right)}
          onNext={() => setIndex(index + 1)}
          onQuit={onClose}
        />
      ) : (
        <QuizCard
          key={`${index}-${step.question.item.key}`}
          question={step.question}
          furigana={furigana}
          prompt={
            step.kind === 'errors'
              ? undefined
              : step.kind === 'particle'
                ? 'Quelle particule ?'
                : step.question.item.key.endsWith('|c')
                  ? 'Transitif ou intransitif ?'
                  : 'Quel verbe ?'
          }
          caption={caption}
          onAnswer={(right) => void answerQuiz(step, right)}
          nextLabel={nextLabel}
          onNext={() => setIndex(index + 1)}
        />
      )}
      {step.kind !== 'conjugation' && (
        <p className="fr quiz-hide">
          <button type="button" className="link" onClick={onClose}>
            Quitter la série
          </button>
        </p>
      )}
    </>
  )
}
