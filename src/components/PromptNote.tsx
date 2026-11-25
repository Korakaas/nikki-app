import { useEffect, useRef, useState } from 'react'
import { Jp } from '../furigana'
import Block, { Pill } from './Block'
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
  /** « Juste le thème » : masque (ou remet) la grammaire et les mots du jour. */
  onToggleThemeOnly: () => void
  /** Change quand les trois étapes demandent de déplier le thème (S1.3). */
  openSignal?: number
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
  openSignal = 0,
}: Props) {
  const { topic, grammar, words } = prompt
  const challenge = prompt.link?.challenge
  const themeOnly = Boolean(prompt.themeOnly)
  // Plié complètement par défaut (juste le titre) ; le choix de Kora est gardé d'une fois sur l'autre.
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem('nikki-theme-open') === '1'
    } catch {
      return false
    }
  })
  const toggleOpen = () =>
    setOpen((v) => {
      try {
        localStorage.setItem('nikki-theme-open', v ? '0' : '1')
      } catch {
        /* stockage indisponible : le choix ne sera pas gardé */
      }
      return !v
    })
  // Un tap sur « Thème » dans les trois étapes déplie le bloc (sans changer le choix gardé d'une fois sur l'autre).
  useEffect(() => {
    if (openSignal > 0) setOpen(true)
  }, [openSignal])
  const [menu, setMenu] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)
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
          <button type="button" role="menuitem" className="danger" onClick={pick(onRemove)}>
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
      title="Thème du jour"
      className="theme-block"
      open={open}
      onToggle={toggleOpen}
      tail={menuButton}
    >
      <div className="theme-body" lang="ja">
        <p className="theme-topic">
          <Jp text={topic.ja} furigana={furigana} />
        </p>
        <p className="tfr fr">{topic.fr}</p>

        {!themeOnly && (
          <>
            <div className="trow">
              <h3 className="trow-head">
                <Pill role="write">文法</Pill>
                <b className="fr">
                  Grammaire · {grammar.level}
                  {grammar.fromAnki ? ' · ton deck' : ''}
                  {grammar.fromReview ? ' · visé par ton bilan' : ''}
                </b>
              </h3>
              <p className="theme-pattern">{grammar.pattern}</p>
              <p className="tnote fr">{grammar.fr}</p>
              {grammar.example && (
                <p className="tnote tex">
                  <Jp text={grammar.example} furigana={furigana} />
                </p>
              )}
              {grammar.exampleFr && <p className="tnote fr">{grammar.exampleFr}</p>}
            </div>

            <div className="trow">
              <h3 className="trow-head">
                <Pill role="write">単語</Pill>
                <b className="fr">Mots</b>
              </h3>
              <ul className="twords">
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
                    )}{' '}
                    <small className="fr">{w.fr}</small>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {(challenge || linkState !== 'idle' || onLink) && (
          <div className="trow note-challenge">
            <h3 className="trow-head trow-fold">
              <button type="button" className="fold" aria-expanded={challengeOpen} onClick={() => setChallengeOpen((v) => !v)}>
                <Pill role="write">訳</Pill>
                <b className="fr">Défi de traduction</b>
                <span className="fold-icon">
                  <Chevron dir={challengeOpen ? 'down' : 'right'} size={20} />
                </span>
              </button>
            </h3>
            {challengeOpen &&
              (challenge ? (
                <>
                  {prompt.link?.bridge && !themeOnly && <p className="fr note-bridge">{prompt.link.bridge}</p>}
                  <p className="fr note-challenge-text">« {challenge} »</p>
                  <p className="fr tnote">Traduis cette phrase en japonais pour commencer ton entrée.</p>
                </>
              ) : linkState === 'loading' ? (
                <p className="tnote fr">Claude prépare un défi de traduction…</p>
              ) : (
                <p className="tnote fr">
                  {linkState === 'error' && 'Pas réussi cette fois. '}
                  <button type="button" className="link" onClick={onLink}>
                    Voir un défi de traduction
                  </button>
                </p>
              ))}
          </div>
        )}
      </div>
    </Block>
  )
}
