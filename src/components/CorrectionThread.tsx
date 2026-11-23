import { useEffect, useRef, useState } from 'react'
import { CorrectionFailure } from '../api'
import { MAX_QUESTION_CHARS, requestAnswer } from '../ask'
import { Jp } from '../furigana'
import { saveThread } from '../thread'
import { threadLimitOf, type Correction, type FuriganaFrom, type Settings, type ThreadTurn } from '../types'
import Chevron from './Chevron'

interface Props {
  entryId: string
  correction: Correction
  settings: Settings
  furigana: FuriganaFrom
  /** Le fil est ouvert (par le bouton ou par le lien d'une faute). */
  open: boolean
  onOpen: () => void
  onClose: () => void
  /** Faute concernée par la prochaine question, « avant → après » ; null pour la correction entière. */
  about: string | null
  onClearAbout: () => void
  onOpenSettings?: () => void
}

function failureMessage(e: unknown): { text: string; noKey: boolean } {
  if (!navigator.onLine) return { text: "Pas de réseau pour l'instant. Ta question est gardée : réessaie plus tard.", noKey: false }
  if (e instanceof CorrectionFailure) return { text: e.message, noKey: e.code === 'no-key' }
  return { text: "Ça n'a pas marché cette fois. Ta question est gardée : réessaie.", noKey: false }
}

/** Fil de questions sur une correction : au plus `threadLimit` échanges, rangés avec elle. */
export default function CorrectionThread({
  entryId,
  correction,
  settings,
  furigana,
  open,
  onOpen,
  onClose,
  about,
  onClearAbout,
  onOpenSettings,
}: Props) {
  const [turns, setTurns] = useState<ThreadTurn[]>(correction.thread ?? [])
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ text: string; noKey: boolean } | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const limit = threadLimitOf(settings)
  const left = limit - turns.length
  const hasKey = Boolean(settings.apiKey)

  useEffect(() => {
    if (open && left > 0) areaRef.current?.focus()
  }, [open, left])

  async function send() {
    const q = question.trim()
    if (!q || busy || left <= 0) return
    setBusy(true)
    setError(null)
    try {
      const r = await requestAnswer(settings, correction, turns, q, about ?? undefined)
      const turn: ThreadTurn = { q, a: r.a, examples: r.examples, at: Date.now(), ...(about ? { about } : {}) }
      const next = [...turns, turn]
      setTurns(next)
      setQuestion('')
      onClearAbout()
      await saveThread(entryId, correction.createdAt, next)
    } catch (e) {
      setError(failureMessage(e))
    } finally {
      setBusy(false)
    }
  }

  // Pas de clé et rien à relire : le bouton n'a rien à offrir.
  if (!hasKey && turns.length === 0) return null

  if (!open) {
    if (turns.length === 0) {
      return (
        <button type="button" className="sketch thread-ask fr" onClick={onOpen}>
          <span className="thread-key" lang="ja">問</span>
          <span className="thread-label">
            <b>Une question ?</b>
            <small>Sur cette correction · {limit} échange{limit > 1 ? 's' : ''} au plus</small>
          </span>
        </button>
      )
    }
    return (
      <div className="thread thread-folded">
        <button type="button" className="fold thread-fold fr" aria-expanded={false} onClick={onOpen}>
          <span className="thread-key" lang="ja">問</span>
          <span className="thread-label">
            <b>Questions sur cette correction</b>
            <small>
              {turns.length} échange{turns.length > 1 ? 's' : ''} · gardés avec la correction
            </small>
          </span>
          <span className="fold-icon">
            <Chevron dir="right" size={20} />
          </span>
        </button>
      </div>
    )
  }

  const shown = Math.min(turns.length + 1, limit)
  return (
    <div className="thread" role="group" aria-label="Questions sur la correction">
      <h3 className="thread-title fr">
        <span lang="ja">問</span> Une question
        <span className="thread-count" aria-live="polite">
          Échange {left > 0 ? shown : turns.length} sur {limit}
        </span>
      </h3>

      {turns.map((t, i) => (
        <div className="thread-turn" key={t.at + '-' + i}>
          {t.about && <span className="thread-chip fr">À propos de : {t.about}</span>}
          <p className="thread-q fr">{t.q}</p>
          <div className="thread-a fr">
            <p>{t.a}</p>
            {t.examples.map((x, j) => (
              <span className="thread-ex blue-ink" lang="ja" key={j}>
                <Jp text={x.ja} furigana={furigana} />
                <small className="fr">{x.fr}</small>
              </span>
            ))}
          </div>
        </div>
      ))}

      {left > 0 ? (
        <>
          {about && (
            <span className="thread-chip fr">
              À propos de : {about}{' '}
              <button type="button" className="thread-chip-x" aria-label="Retirer la faute : question sur toute la correction" onClick={onClearAbout}>
                ×
              </button>
            </span>
          )}
          <label className="visually-hidden" htmlFor="thread-question">
            Ta question en français
          </label>
          <textarea
            id="thread-question"
            ref={areaRef}
            className="thread-input fr"
            rows={2}
            maxLength={MAX_QUESTION_CHARS}
            value={question}
            placeholder={turns.length === 0 ? 'Pose ta question en français' : `Une autre question ? (${left} échange${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''})`}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="thread-actions">
            <button type="button" className="sketch primary fr" disabled={!question.trim() || busy} onClick={() => void send()}>
              {busy ? 'Je réfléchis…' : 'Envoyer'}
            </button>
            <button type="button" className="sketch fr" onClick={onClose}>
              Fermer
            </button>
          </div>
          {turns.length === 0 && !error && <p className="thread-sub fr">Claude connaît ton entrée{about ? ' et cette faute' : ' et sa correction'}.</p>}
        </>
      ) : (
        <>
          <p className="thread-limit fr">
            C'est le dernier échange de cette correction : le plafond garde les coûts bas. Tu peux le changer dans{' '}
            {onOpenSettings ? (
              <button type="button" className="link" onClick={onOpenSettings}>
                Réglages
              </button>
            ) : (
              'Réglages'
            )}
            .
          </p>
          <div className="thread-actions">
            <button type="button" className="sketch fr" onClick={onClose}>
              Fermer
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="thread-error fr" role="alert">
          {error.text}{' '}
          {error.noKey && onOpenSettings && (
            <button type="button" className="link" onClick={onOpenSettings}>
              Ouvrir les réglages
            </button>
          )}
        </p>
      )}
    </div>
  )
}
