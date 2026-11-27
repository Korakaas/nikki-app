import { useEffect, useRef, useState } from 'react'
import { Jp, plainText } from '../furigana'
import { formatById, formatOfDay } from '../formats'
import { situationOfDay } from '../prompts/situations'
import type { DailyPrompt, FuriganaFrom } from '../types'
import { wordUsed } from '../words'
import Block, { Pill } from './Block'
import Chevron from './Chevron'

interface Props {
  /** Jour affiché (YYYY-MM-DD) : le format et le texte ne dépendent que de la date. */
  id: string
  furigana: FuriganaFrom
  /** Texte en cours d'écriture : les amorces ne s'insèrent que si la page est vide, les mots employés sont cochés. */
  text: string
  /** Grammaire et mots du jour (tirés selon le format) ; null le temps du chargement. */
  prompt: DailyPrompt | null
  /** Défi de traduction : en cours de demande, raté, ou rien à signaler. */
  linkState?: 'idle' | 'loading' | 'error'
  /** Demande le défi de traduction (absent si pas de clé API). */
  onLink?: () => void
  /** Tout changer : une autre grammaire et d'autres mots. */
  onAnother: () => void
  onChangeGrammar: () => void
  onChangeWords: () => void
  /** « Sans grammaire ni mots » : masque (ou remet) le coin « Pour t'aider ». */
  onToggleThemeOnly: () => void
  onStarter: (plain: string) => void
}

const KEY = 'nikki-format-open'
const AIDE_KEY = 'nikki-aide-open'

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === '1'
  } catch {
    return fallback
  }
}

function writeFlag(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* stockage indisponible : le choix ne sera pas gardé */
  }
}

/**
 * Le format du jour (S5.4a, S5.6a) : un seul bloc pour tout ce qui aide à écrire.
 * Le format (consigne, mise en situation, amorces), puis « Pour t'aider » : le point de grammaire et
 * les trois mots du jour, choisis pour aller avec le format. Les actions rares sont dans le menu « ⋯ ».
 * Rien n'est imposé : écrire autre chose reste possible.
 */
export default function FormatBlock({
  id,
  furigana,
  text,
  prompt,
  linkState = 'idle',
  onLink,
  onAnother,
  onChangeGrammar,
  onChangeWords,
  onToggleThemeOnly,
  onStarter,
}: Props) {
  const format = formatById(formatOfDay(id))
  const situation = situationOfDay(id)
  const [open, setOpen] = useState(() => readFlag(KEY, true))
  const [aideOpen, setAideOpen] = useState(() => readFlag(AIDE_KEY, false))
  const [aide, setAide] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  // L'aide en français et le défi se referment d'un jour à l'autre.
  useEffect(() => {
    setAide(false)
    setChallengeOpen(false)
    setMenu(false)
  }, [id])

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

  const toggle = () =>
    setOpen((v) => {
      writeFlag(KEY, !v)
      return !v
    })
  const toggleAide = () =>
    setAideOpen((v) => {
      writeFlag(AIDE_KEY, !v)
      return !v
    })
  const pick = (action: () => void) => () => {
    setMenu(false)
    action()
  }

  const empty = text.trim() === ''
  const themeOnly = Boolean(prompt?.themeOnly)
  const grammar = prompt?.grammar
  const words = prompt?.words ?? []
  const challenge = prompt?.link?.challenge
  // Le journal libre n'a pas de consigne propre : le sujet du jour tient la place de la mise en situation.
  const subject = format.id === 'journal' ? prompt?.topic : undefined

  const menuButton = prompt ? (
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
            {themeOnly ? 'Remettre grammaire et mots' : 'Sans grammaire ni mots'}
          </button>
          <button type="button" role="menuitem" onClick={pick(onAnother)}>
            Tout changer
          </button>
        </div>
      )}
    </div>
  ) : undefined

  return (
    <Block
      role="write"
      ja="形"
      title="Format du jour"
      className="format-block"
      open={open}
      onToggle={toggle}
      tail={menuButton}
      summary={
        <>
          <span lang="ja">{format.ja}</span> · {format.fr}
        </>
      }
    >
      <div className="format-body">
        <p className="format-name">
          <span lang="ja">{format.ja}</span> · <span className="fr">{format.fr}</span>
        </p>
        <p className="format-consigne fr">{format.consigne}</p>

        {subject && (
          <div className="format-situation format-subject">
            <p className="format-text" lang="ja">
              <Jp text={subject.ja} furigana={furigana} />
            </p>
            <p className="format-todo fr">{subject.fr}</p>
          </div>
        )}

        {situation && (
          <div className="format-situation">
            <p className="format-text" lang="ja">
              <Jp text={situation.ja} furigana={furigana} />
            </p>
            {situation.todo && <p className="format-todo fr">À toi : {situation.todo}</p>}
            <button type="button" className="link format-aide-button fr" aria-expanded={aide} onClick={() => setAide((v) => !v)}>
              {aide ? "Cacher l'aide" : 'Aide en français'}
            </button>
            {aide && <p className="format-aide fr">{situation.aide}</p>}
          </div>
        )}

        {empty && format.starters.length > 0 && (
          <div className="format-starters" role="group" aria-label="Amorces du format">
            {format.starters.map((st) => (
              <button
                key={st.ja}
                type="button"
                className="sketch starter format-starter"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onStarter(plainText(st.ja))}
              >
                <span className="starter-ja" lang="ja">
                  <Jp text={st.ja} furigana={furigana} />
                </span>
                <span className="starter-fr fr">{st.fr}</span>
              </button>
            ))}
          </div>
        )}

        {prompt && grammar && !themeOnly && (
          <div className="format-aide-zone theme-body" lang="ja">
            <h3 className="trow-head trow-fold">
              <button type="button" className="fold" aria-expanded={aideOpen} onClick={toggleAide}>
                <Pill role="write">助</Pill>
                <b className="fr">Pour t'aider</b>
                <span className="fold-icon">
                  <Chevron dir={aideOpen ? 'down' : 'right'} size={20} />
                </span>
              </button>
            </h3>
            {!aideOpen && (
              <p className="aide-sum fr">
                <span lang="ja">{grammar.pattern}</span> · {words.length} mots
              </p>
            )}
            {aideOpen && (
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
                          {prompt.link?.bridge && <p className="fr note-bridge">{prompt.link.bridge}</p>}
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
              </>
            )}
          </div>
        )}
      </div>
    </Block>
  )
}
