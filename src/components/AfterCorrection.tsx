import { useEffect, useRef, useState } from 'react'
import { buildSession, type SessionItem } from '../conj/srs'
import { deckVerbs } from '../conj/verbs'
import { listEntries, loadAnki, loadConj, loadQuizHistory, saveQuizHistory, todayId } from '../db'
import { Jp, plainText } from '../furigana'
import { applyFixes, diffChars, squash } from '../rewrite'
import { buildQuiz, collectItems, hideItem, recentFromDay, recordAnswer, type QuizHistory, type QuizQuestion } from '../quiz'
import type { BonusSentence, Correction, FuriganaFrom } from '../types'
import Chevron from './Chevron'
import ConjSession from './ConjSession'
import QuizCard from './QuizCard'


/** Une ligne du bloc « Pour continuer » : mot japonais, titre, chevron ; un tap déplie le contenu dessous (S18.14). */
function ContinueRow({
  ja,
  title,
  value,
  open,
  onToggle,
  children,
}: {
  ja: string
  title: string
  value?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <li className="setting-row continue-row">
      <button type="button" className="row-line" aria-expanded={open} onClick={onToggle}>
        <span className="rk" lang="ja">
          {ja}
        </span>
        <span className="rt">{title}</span>
        {value ? <span className="rv">{value}</span> : null}
        <span className="rc">
          <Chevron dir={open ? 'down' : 'right'} size={18} />
        </span>
      </button>
      {open && <div className="row-panel continue-panel">{children}</div>}
    </li>
  )
}

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
  const [open, setOpen] = useState(false)
  return (
    <ContinueRow ja="もう一文" title="Une phrase bonus" value={added ? 'ajoutée ✓' : undefined} open={open} onToggle={() => setOpen((v) => !v)}>
      <p className="bonus-ja" lang="ja">
        <Jp text={bonus.ja} furigana={furigana} />
      </p>
      <p className="fr note-fr">{bonus.fr}</p>
      {bonus.why && <p className="fr bonus-why">{bonus.why}</p>}
      <div className="actions">
        {added ? (
          <span className="fr">Ajoutée à ton entrée ✓</span>
        ) : (
          <button type="button" className="sketch" onClick={() => onAdd(sentence)}>
            Ajouter à mon entrée
          </button>
        )}
      </div>
    </ContinueRow>
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
  const [open, setOpen] = useState(false)
  const history = useRef<QuizHistory>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const all = await listEntries()
      const here = new Set(collectItems(all.filter((e) => e.id === currentId)).map((i) => i.key))
      const items = collectItems(all.filter((e) => e.id !== currentId)).filter((i) => !here.has(i.key))
      if (items.length < 2) return
      history.current = await loadQuizHistory().catch(() => ({}))
      if (!cancelled) setQuestion(buildQuiz(items, history.current, 1, Math.random, Date.now(), recentFromDay(todayId()))[0] ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [currentId, correctionKey])

  if (!question) return null
  return (
    <ContinueRow ja="復習" title="Révision éclair" open={open} onToggle={() => setOpen((v) => !v)}>
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
    </ContinueRow>
  )
}

/** Réécrire de mémoire la version corrigée, puis voir la différence caractère par caractère. */
export function RewriteCard({ correction }: { correction: Correction }) {
  const target = squash(applyFixes(correction))
  const [rowOpen, setRowOpen] = useState(false)
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
    <ContinueRow ja="書き直し" title="Réécrire sans regarder" open={rowOpen} onToggle={() => setRowOpen((v) => !v)}>
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
                <p>
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
    </ContinueRow>
  )
}

/** Trois cartes de conjugaison (révisions dues d'abord) juste après la correction. */
export function ConjDaily({ correctionKey }: { correctionKey: number }) {
  const [items, setItems] = useState<SessionItem[] | null>(null)
  const [rowOpen, setRowOpen] = useState(false)
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
    <ContinueRow ja="活用" title="Conjugaison éclair" open={rowOpen} onToggle={() => setRowOpen((v) => !v)}>
      {finished ? (
        <p className="fr">
          <strong>
            {finished.right} / {finished.total}
          </strong>{' '}
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
    </ContinueRow>
  )
}
