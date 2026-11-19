import { useState } from 'react'
import { Jp } from '../furigana'
import Chevron from './Chevron'
import type { DailyPrompt, FuriganaFrom } from '../types'
import { wordUsed } from '../words'

interface Props {
  prompt: DailyPrompt
  furigana: FuriganaFrom
  onAnother: () => void
  /** Change seulement le point de grammaire (le sujet et les mots restent). */
  onChangeGrammar: () => void
  /** Change seulement les mots (le sujet et la grammaire restent). */
  onChangeWords: () => void
  onRemove: () => void
  /** Texte en cours d'écriture : les mots du jour déjà employés sont cochés. */
  text?: string
  /** Défi de traduction : en cours de demande, raté, ou rien à signaler. */
  linkState?: 'idle' | 'loading' | 'error'
  /** Demande le défi de traduction (absent si pas de clé API). */
  onLink?: () => void
}

/** Petit mot collé en haut de la page : le sujet, un point de grammaire, trois mots. */
export default function PromptNote({
  prompt,
  furigana,
  onAnother,
  onChangeGrammar,
  onChangeWords,
  onRemove,
  text = '',
  linkState = 'idle',
  onLink,
}: Props) {
  const { topic, grammar, words } = prompt
  const challenge = prompt.link?.challenge
  const [open, setOpen] = useState(false)
  return (
    <aside className="note-card" lang="ja" aria-label="Idée du jour">
      <span className="tape" aria-hidden="true" />

      <h2 className="note-title blue-ink">
        <button
          type="button"
          className="fold"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span>今日のお題</span>
          <span className="fr">Idée du jour</span>
          <span className="fold-icon">
            <Chevron dir={open ? 'down' : 'right'} size={22} />
          </span>
        </button>
      </h2>
      {!open && (
        <p className="note-summary blue-ink">
          <Jp text={topic.ja} furigana={furigana} />
          <span className="fr"> · {grammar.pattern}{grammar.fromReview ? ' ★' : ''}</span>
        </p>
      )}
      {open && (
        <>
      <p className="note-topic blue-ink">
        <Jp text={topic.ja} furigana={furigana} />
      </p>
      <p className="note-fr fr">{topic.fr}</p>

      <h3 className="note-part blue-ink">
        <span>文法</span>
        <span className="fr">
          Grammaire {grammar.level}
          {grammar.fromAnki ? ' · ton deck' : ''}
          {grammar.fromReview ? ' · visé par ton bilan' : ''}
        </span>
        <button type="button" className="sketch note-change fr" aria-label="Changer la grammaire" onClick={onChangeGrammar}>
          Changer
        </button>
      </h3>
      <p className="note-pattern green-ink">{grammar.pattern}</p>
      <p className="note-fr fr">{grammar.fr}</p>
      {grammar.example && (
        <p className="note-example blue-ink">
          <Jp text={grammar.example} furigana={furigana} />
        </p>
      )}
      {grammar.exampleFr && <p className="note-fr fr">{grammar.exampleFr}</p>}

      <h3 className="note-part blue-ink">
        <span>単語</span>
        <span className="fr">Mots</span>
        <button type="button" className="sketch note-change fr" aria-label="Changer les mots" onClick={onChangeWords}>
          Changer
        </button>
      </h3>
      <ul className="note-words">
        {words.map((w) => (
          <li key={w.ja}>
            {wordUsed(w, text) && (
              <span className="word-done green-ink" role="img" aria-label="employé">
                ✓{' '}
              </span>
            )}
            {w.reading ? (
              <ruby className="blue-ink">
                {w.ja}
                <rp>(</rp>
                <rt>{w.reading}</rt>
                <rp>)</rp>
              </ruby>
            ) : (
              <span className="blue-ink">{w.ja}</span>
            )}
            <span className="fr"> — {w.fr}</span>
          </li>
        ))}
      </ul>

      {(challenge || linkState !== 'idle' || onLink) && (
        <div className="note-link">
          <div className="note-challenge">
            <h3 className="note-part blue-ink">
              <span>訳</span>
              <span className="fr">Défi de traduction</span>
            </h3>
            {challenge ? (
              <>
                <p className="fr note-challenge-text">« {challenge} »</p>
                <p className="fr note-fr">Traduis cette phrase en japonais pour commencer ton entrée.</p>
              </>
            ) : linkState === 'loading' ? (
              <p className="note-fr fr">Claude prépare un défi de traduction…</p>
            ) : (
              <p className="note-fr fr">
                {linkState === 'error' && 'Pas réussi cette fois. '}
                <button type="button" className="link" onClick={onLink}>
                  Voir un défi de traduction
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="note-actions" lang="fr">
        <button type="button" className="link" onClick={onAnother}>
          Tout changer
        </button>
        <button type="button" className="link" onClick={onRemove}>
          Retirer le sujet
        </button>
      </div>
        </>
      )}
    </aside>
  )
}
