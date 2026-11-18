import { useEffect, useRef, useState } from 'react'
import { buildSession, type SessionItem } from '../conj/srs'
import { deckVerbs } from '../conj/verbs'
import { listEntries, loadAnki, loadConj, loadQuizHistory, saveQuizHistory, todayId } from '../db'
import { Jp, plainText } from '../furigana'
import { applyFixes, diffChars, squash } from '../rewrite'
import { buildQuiz, collectItems, hideItem, recordAnswer, type QuizHistory, type QuizQuestion } from '../quiz'
import type { BonusSentence, Correction, FuriganaFrom } from '../types'
import ConjSession from './ConjSession'
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
        onHide={() => {
          history.current = hideItem(history.current, question.item.key)
          void saveQuizHistory(history.current).catch(() => undefined)
          setQuestion(null)
        }}
        onAnswer={(right) => {
          history.current = recordAnswer(history.current, question.item.key, right)
          void saveQuizHistory(history.current).catch(() => undefined)
        }}
      />
    </section>
  )
}

/** Réécrire de mémoire la version corrigée, puis voir la différence caractère par caractère. */
export function RewriteCard({ correction }: { correction: Correction }) {
  const target = squash(applyFixes(correction))
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(false)

  // Une nouvelle correction repart de zéro.
  useEffect(() => {
    setOpen(false)
    setTyped('')
    setChecked(false)
  }, [correction.createdAt])

  if (correction.errors.length === 0) return null
  const parts = checked ? diffChars(squash(typed), target) : []
  const wrong = parts.filter((p) => p.type !== 'same').reduce((n, p) => n + [...p.text].length, 0)

  return (
    <section className="after-card" aria-label="Réécrire sans regarder">
      <h2 className="part">
        <span lang="ja">書き直し</span>
        <span className="fr">Réécrire sans regarder</span>
      </h2>
      {!open ? (
        <>
          <p className="fr note-fr">
            Lis la correction, puis réécris ton texte corrigé de mémoire. Retaper la bonne forme aide à la retenir.
          </p>
          <div className="actions">
            <button type="button" className="sketch" onClick={() => setOpen(true)}>
              Réécrire
            </button>
          </div>
        </>
      ) : (
        <>
          <textarea
            className="rewrite-input"
            lang="ja"
            rows={4}
            value={typed}
            placeholder="Ton texte, avec les fautes corrigées…"
            onChange={(e) => {
              setTyped(e.target.value)
              setChecked(false)
            }}
          />
          <div className="actions">
            <button
              type="button"
              className="sketch primary"
              disabled={typed.trim() === ''}
              onClick={() => setChecked(true)}
            >
              Vérifier
            </button>
          </div>
          {checked && (
            <div className="rewrite-result" lang="ja">
              {wrong === 0 ? (
                <p className="green-ink">
                  <span lang="fr">Parfait, tout est juste !</span>
                </p>
              ) : (
                <>
                  <p className="fr">
                    {wrong} caractère{wrong > 1 ? 's' : ''} à revoir : <span className="red-ink">en rouge, ce qui est faux</span>,{' '}
                    <span className="green-ink">en vert, ce qu'il fallait écrire</span>.
                  </p>
                  <p className="sheet rewrite-diff">
                    {parts.map((p, i) =>
                      p.type === 'same' ? (
                        <span key={i}>{p.text}</span>
                      ) : p.type === 'wrong' ? (
                        <del key={i} className="red-ink">
                          {p.text}
                        </del>
                      ) : (
                        <ins key={i} className="green-ink">
                          {p.text}
                        </ins>
                      ),
                    )}
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

/** Trois cartes de conjugaison (révisions dues d'abord) juste après la correction. */
export function ConjDaily({ correctionKey }: { correctionKey: number }) {
  const [items, setItems] = useState<SessionItem[] | null>(null)
  const [open, setOpen] = useState(false)
  const [finished, setFinished] = useState<{ right: number; total: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    setOpen(false)
    setFinished(null)
    void (async () => {
      const library = await loadAnki().catch(() => null)
      const verbs = deckVerbs(library)
      if (verbs.length === 0) return
      const state = await loadConj().catch(() => null)
      if (!state || cancelled) return
      const built = buildSession(state, verbs, todayId(), 'form', 3)
      if (!cancelled) setItems(built.length > 0 ? built : null)
    })()
    return () => {
      cancelled = true
    }
  }, [correctionKey])

  if (!items) return null
  return (
    <section className="after-card" aria-label="Conjugaison éclair">
      <h2 className="part">
        <span lang="ja">活用</span>
        <span className="fr">Conjugaison éclair</span>
      </h2>
      {finished ? (
        <p className="fr">
          <span className="green-ink">
            {finished.right} / {finished.total}
          </span>{' '}
          — la suite est dans Stats.
        </p>
      ) : open ? (
        <ConjSession
          items={items}
          onClose={(r) => {
            setOpen(false)
            if (r) setFinished(r)
          }}
        />
      ) : (
        <>
          <p className="fr empty">3 verbes de ton deck, à conjuguer à l'écrit (les révisions dues d'abord).</p>
          <div className="actions">
            <button type="button" className="sketch primary" onClick={() => setOpen(true)}>
              C'est parti
            </button>
          </div>
        </>
      )}
    </section>
  )
}
