import { useEffect, useRef, useState } from 'react'
import { Jp } from '../furigana'
import Block from './Block'
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
  /** « Juste le thème » : masque (ou remet) la grammaire et les mots du jour. */
  onToggleThemeOnly: () => void
  /** Texte en cours d'écriture : les mots du jour déjà employés sont cochés. */
  text?: string
  /** Défi de traduction : en cours de demande, raté, ou rien à signaler. */
  linkState?: 'idle' | 'loading' | 'error'
  /** Demande le défi de traduction (absent si pas de clé API). */
  onLink?: () => void
}

/**
 * Le thème du jour (S18.13) : un bloc plié par défaut, trois lignes (Sujet / Grammaire / Mots).
 * Aucun bouton visible : les actions rares sont dans le menu discret « ⋯ ».
 */
export default function PromptNote({
  prompt,
  furigana,
  onAnother,
  onChangeGrammar,
  onChangeWords,
  onRemove,
  onToggleThemeOnly,
  text = '',
  linkState = 'idle',
  onLink,
}: Props) {
  const { topic, grammar, words } = prompt
  const challenge = prompt.link?.challenge
  const themeOnly = Boolean(prompt.themeOnly)
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Le menu se ferme en touchant ailleurs ou avec Échap.
  useEffect(() => {
    if (!menu) return
    const onDown = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  const pick = (action: () => void) => () => {
    setMenu(false)
    action()
  }

  const summary = (
    <>
      <span className="theme-line">
        <span className="theme-label">Sujet</span>
        <span lang="ja">
          <Jp text={topic.ja} furigana={furigana} />
        </span>
      </span>
      {!themeOnly && (
        <>
          <span className="theme-line">
            <span className="theme-label">Grammaire</span>
            <span lang="ja">
              {grammar.pattern}
              {grammar.fromReview ? ' ★' : ''}
            </span>
          </span>
          <span className="theme-line">
            <span className="theme-label">Mots</span>
            <span lang="ja">{words.map((w) => w.ja).join('・')}</span>
          </span>
        </>
      )}
    </>
  )

  const menuButton = (
    <div className="more" ref={menuRef}>
      <button
        type="button"
        className="more-button"
        aria-label="Plus d'actions"
        aria-haspopup="menu"
        aria-expanded={menu}
        onClick={() => setMenu((v) => !v)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {menu && (
        <div className="more-menu fr" role="menu">
          {!themeOnly && (
            <>
              <button type="button" role="menuitem" onClick={pick(onChangeGrammar)}>
                Changer la grammaire
              </button>
              <button type="button" role="menuitem" onClick={pick(onChangeWords)}>
                Changer les mots
              </button>
            </>
          )}
          <button type="button" role="menuitem" onClick={pick(onToggleThemeOnly)}>
            {themeOnly ? 'Remettre mots et grammaire' : 'Juste le thème'}
          </button>
          <button type="button" role="menuitem" onClick={pick(onAnother)}>
            Tout changer
          </button>
          <button type="button" role="menuitem" onClick={pick(onRemove)}>
            Retirer le sujet
          </button>
        </div>
      )}
    </div>
  )

  return (
    <Block
      role="write"
      ja="題"
      title="Idée du jour"
      className="theme-block"
      open={open}
      onToggle={() => setOpen((v) => !v)}
      summary={summary}
      tail={menuButton}
    >
      <div className="theme-body" lang="ja">
        <p className="theme-topic">
          <Jp text={topic.ja} furigana={furigana} />
        </p>
        <p className="note-fr fr">{topic.fr}</p>

        {!themeOnly && (
          <>
            <h3 className="theme-part">
              <span lang="ja">文法</span>
              <span className="fr">
                Grammaire {grammar.level}
                {grammar.fromAnki ? ' · ton deck' : ''}
                {grammar.fromReview ? ' · visé par ton bilan' : ''}
              </span>
            </h3>
            <p className="theme-pattern">{grammar.pattern}</p>
            <p className="note-fr fr">{grammar.fr}</p>
            {grammar.example && (
              <p className="note-example">
                <Jp text={grammar.example} furigana={furigana} />
              </p>
            )}
            {grammar.exampleFr && <p className="note-fr fr">{grammar.exampleFr}</p>}

            <h3 className="theme-part">
              <span lang="ja">単語</span>
              <span className="fr">Mots</span>
            </h3>
            <ul className="note-words">
              {words.map((w) => (
                <li key={w.ja}>
                  {wordUsed(w, text) && (
                    <span className="word-done" role="img" aria-label="employé">
                      ✓{' '}
                    </span>
                  )}
                  {w.reading ? (
                    <ruby>
                      {w.ja}
                      <rp>(</rp>
                      <rt>{w.reading}</rt>
                      <rp>)</rp>
                    </ruby>
                  ) : (
                    <span>{w.ja}</span>
                  )}
                  <span className="fr"> — {w.fr}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {(challenge || linkState !== 'idle' || onLink) && (
          <div className="note-link">
            <div className="note-challenge">
              <h3 className="theme-part">
                <span lang="ja">訳</span>
                <span className="fr">Défi de traduction</span>
              </h3>
              {challenge ? (
                <>
                  {prompt.link?.bridge && !themeOnly && <p className="fr note-bridge">{prompt.link.bridge}</p>}
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
      </div>
    </Block>
  )
}
