import { useEffect, useRef, useState } from 'react'
import { conjugate, checkAnswer, explain, formInfo, GROUP_LABEL, type Group, type Verb } from '../conj/engine'
import { answerCard, cardKey, GROUP_FORM, hideVerb, type ConjState, type SessionItem } from '../conj/srs'
import { loadConj, saveConj, todayId } from '../db'

type QItem = SessionItem & { retry?: boolean }

interface Missed {
  verb: Verb
  form: SessionItem['form']
}

/** « Quel groupe ? » a trois réponses : les deux groupes, et les verbes irréguliers. */
const GROUP_CHOICES: { id: 'godan' | 'ichidan' | 'irregular'; label: string }[] = [
  { id: 'godan', label: 'Groupe 1 (五段)' },
  { id: 'ichidan', label: 'Groupe 2 (一段)' },
  { id: 'irregular', label: 'Irrégulier (する・来る)' },
]

function choiceOf(group: Group): 'godan' | 'ichidan' | 'irregular' {
  return group === 'godan' || group === 'ichidan' ? group : 'irregular'
}

function VerbHead({ verb }: { verb: Verb }) {
  return (
    <p className="conj-verb-line">
      <span className="conj-verb" lang="ja">
        {verb.ja}
      </span>
      {verb.reading && verb.reading !== verb.ja && (
        <span className="conj-reading" lang="ja">
          （{verb.reading}）
        </span>
      )}
      <span className="conj-meaning fr"> {verb.fr}</span>
    </p>
  )
}

/** Forme attendue, telle qu'on l'affiche après la réponse. */
function Expected({ verb, form }: { verb: Verb; form: SessionItem['form'] }) {
  if (form === GROUP_FORM) return null
  const c = conjugate(verb, form)
  if (!c) return null
  return (
    <p lang="ja" className="conj-expected">
      {c.ja}
      {c.reading !== c.ja && <span className="conj-reading">（{c.reading}）</span>}
      {c.alternatives.length > 0 && (
        <span className="conj-alt fr"> · aussi : {c.alternatives.join('、')}</span>
      )}
    </p>
  )
}

interface Props {
  items: SessionItem[]
  /** Appelé à la fermeture, avec le score final (ou null si on quitte avant la fin). */
  onClose: (result: { right: number; total: number } | null) => void
  /** Propose d'enchaîner une autre série (Stats seulement). */
  onAgain?: () => void
}

/** Une série de cartes de conjugaison : réponse écrite, ou choix du groupe. */
export default function ConjSession({ items, onClose, onAgain }: Props) {
  const [queue, setQueue] = useState<QItem[]>(items)
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<{ right: boolean; picked?: string } | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [missed, setMissed] = useState<Missed[]>([])
  const stateRef = useRef<ConjState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadConj().then((s) => {
      stateRef.current = s
    })
  }, [])

  const done = index >= queue.length
  const item = done ? null : queue[index]

  useEffect(() => {
    if (item && item.form !== GROUP_FORM && !result) inputRef.current?.focus()
  }, [index, item, result])

  async function record(it: QItem, right: boolean) {
    if (it.retry) return
    setTotal((t) => t + 1)
    if (right) setScore((s) => s + 1)
    else {
      setMissed((m) => [...m, { verb: it.verb, form: it.form }])
      // Une seule seconde chance, à la fin de la série (sans compter dans le score).
      setQueue((q) => [...q, { ...it, retry: true }])
    }
    const base = stateRef.current ?? (await loadConj())
    stateRef.current = answerCard(base, cardKey(it.verb, it.form), right, todayId())
    await saveConj(stateRef.current).catch(() => undefined)
  }

  function submitForm(raw: string) {
    if (!item || result || item.form === GROUP_FORM) return
    const right = raw.trim() !== '' && checkAnswer(item.verb, item.form, raw)
    setResult({ right })
    void record(item, right)
  }

  function pickGroup(id: string) {
    if (!item || result) return
    const right = id === choiceOf(item.verb.group)
    setResult({ right, picked: id })
    void record(item, right)
  }

  function next() {
    setResult(null)
    setTyped('')
    setIndex((i) => i + 1)
  }

  async function hide() {
    if (!item) return
    const ja = item.verb.ja
    const base = stateRef.current ?? (await loadConj())
    stateRef.current = hideVerb(base, ja)
    await saveConj(stateRef.current).catch(() => undefined)
    // Le verbe disparaît aussi du reste de la série ; la question suivante prend sa place.
    setQueue((q) => q.filter((x, i) => i < index || (i > index && x.verb.ja !== ja)))
    setMissed((m) => m.filter((x) => x.verb.ja !== ja))
    setResult(null)
    setTyped('')
  }

  if (done) {
    return (
      <div className="quiz">
        <p className="quiz-score green-ink">
          {score} / {total}
        </p>
        {missed.length > 0 && (
          <>
            <h3 className="sub fr">À retenir</h3>
            <ul className="review-list">
              {missed.map((m) => (
                <li key={cardKey(m.verb, m.form)}>
                  <p lang="ja" className="conj-missed">
                    {m.verb.ja}
                    {m.form === GROUP_FORM ? (
                      <span className="fr"> → {GROUP_LABEL[m.verb.group]}</span>
                    ) : (
                      <>
                        <span className="fix-arrow" aria-hidden="true">
                          {' '}
                          {formInfo(m.form).ja} →{' '}
                        </span>
                        <span className="red-ink">{conjugate(m.verb, m.form)?.ja}</span>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="actions quiz-actions">
          {onAgain && (
            <button type="button" className="sketch primary" onClick={onAgain}>
              Encore une série
            </button>
          )}
          <button type="button" className="sketch" onClick={() => onClose({ right: score, total })}>
            Fermer
          </button>
        </div>
      </div>
    )
  }

  if (!item) return null
  const isGroup = item.form === GROUP_FORM
  const info = isGroup ? null : formInfo(item.form as Exclude<SessionItem['form'], 'group'>)
  const nextLabel = index + 1 >= queue.length ? 'Voir le résultat' : 'Suivante'

  return (
    <div className="quiz conj-card">
      <p className="fr quiz-count">
        {`Carte ${index + 1} sur ${queue.length}`}
        {item.retry ? ' · seconde chance' : item.fresh ? ' · nouveau' : ' · à revoir'}
      </p>
      <VerbHead verb={item.verb} />

      {isGroup ? (
        <>
          <p className="quiz-prompt fr">Quel groupe ?</p>
          <ul className="quiz-options">
            {GROUP_CHOICES.map((c) => {
              const state = !result
                ? ''
                : c.id === choiceOf(item.verb.group)
                  ? 'right'
                  : c.id === result.picked
                    ? 'wrong'
                    : 'dim'
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`quiz-option ${state}`}
                    disabled={!!result}
                    onClick={() => pickGroup(c.id)}
                  >
                    {c.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <>
          <p className="quiz-prompt fr">
            Mets-le à la forme <strong lang="ja">{info!.ja}</strong> — {info!.fr}
          </p>
          <form
            className="conj-form"
            onSubmit={(e) => {
              e.preventDefault()
              submitForm(typed)
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
              readOnly={!!result}
              onChange={(e) => setTyped(e.target.value)}
            />
            {!result && (
              <div className="actions quiz-actions">
                <button type="submit" className="sketch primary" disabled={typed.trim() === ''}>
                  Vérifier
                </button>
                <button type="button" className="sketch" onClick={() => submitForm('')}>
                  Je ne sais pas
                </button>
              </div>
            )}
          </form>
        </>
      )}

      {result && (
        <div className="quiz-result">
          <p className={result.right ? 'green-ink' : 'red-ink'}>
            <span lang="fr">{result.right ? 'Bien joué !' : 'Pas tout à fait.'}</span>
          </p>
          {isGroup ? (
            <p className="fix-why fr">
              {GROUP_LABEL[item.verb.group]}.{' '}
              <span lang="ja">
                {[conjugate(item.verb, 'nai'), conjugate(item.verb, 'te')]
                  .filter((c) => c)
                  .map((c) => c!.ja)
                  .join(' · ')}
              </span>
            </p>
          ) : (
            <>
              <Expected verb={item.verb} form={item.form} />
              <p className="fix-why fr">{explain(item.verb, item.form as Exclude<SessionItem['form'], 'group'>)}</p>
            </>
          )}
          <div className="actions">
            <button type="button" className="sketch primary" autoFocus onClick={next}>
              {nextLabel}
            </button>
          </div>
          <p className="fr quiz-hide">
            <button type="button" className="link" onClick={() => void hide()}>
              Retirer ce verbe (mauvais groupe ou mauvaise lecture dans le deck)
            </button>
          </p>
        </div>
      )}
      {!result && (
        <p className="fr quiz-hide">
          <button type="button" className="link" onClick={() => onClose(null)}>
            Quitter la série
          </button>
        </p>
      )}
    </div>
  )
}
