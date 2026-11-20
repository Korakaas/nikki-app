import { useEffect, useRef, useState } from 'react'
import { CorrectionFailure } from '../api'
import { Jp, plainText } from '../furigana'
import { MAX_SAY_CHARS, requestSay, type Formulation } from '../say'
import { requestUnblock, type Unblock } from '../unblock'
import type { Settings } from '../types'

type View = 'menu' | 'say' | 'unblock'

interface Props {
  settings: Settings
  /** Texte actuel de l'entrée (jamais modifié ici, seulement lu comme contexte). */
  text: string
  /** Sujet du jour, s'il y en a un. */
  topic?: string
  /** Les amorces ne s'offrent que sur une page vide. */
  canStarters: boolean
  /** La rangée d'amorces est déjà ouverte : la ligne du menu sert alors à la refermer. */
  startersOpen: boolean
  onClose: () => void
  /** Place une phrase à la fin de l'entrée. */
  onAppend: (phrase: string) => void
  onStarters: () => void
  onOpenSettings: () => void
}

function failureMessage(e: unknown): { text: string; noKey: boolean } {
  if (!navigator.onLine) return { text: "Pas de réseau pour l'instant. Réessaie plus tard : ton texte est intact.", noKey: false }
  if (e instanceof CorrectionFailure) return { text: e.message, noKey: e.code === 'no-key' }
  return { text: "Ça n'a pas marché cette fois. Réessaie : ton texte est intact.", noKey: false }
}

/** Feuille « Besoin d'aide ? » : trois façons de se débloquer, sans rien évaluer ni toucher au texte. */
export default function HelpSheet({ settings, text, topic, canStarters, startersOpen, onClose, onAppend, onStarters, onOpenSettings }: Props) {
  const [view, setView] = useState<View>('menu')
  const [bottom, setBottom] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Le clavier ne doit pas recouvrir la feuille : on la remonte de sa hauteur.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setBottom(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    sheetRef.current?.focus()
  }, [view])

  return (
    <div className="help-backdrop" onClick={onClose}>
      <div
        ref={sheetRef}
        className="help-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Besoin d'aide ?"
        tabIndex={-1}
        style={{ bottom }}
        onClick={(e) => e.stopPropagation()}
      >
        {view === 'menu' && (
          <>
            <h2 className="fr">Besoin d'aide ?</h2>
            <p className="help-sub fr">Rien n'est évalué ici, et ton texte reste intact.</p>
            <button type="button" className="help-row" onClick={() => setView('say')}>
              <span className="help-key" lang="ja">訳</span>
              <span className="help-label fr">
                <b>Comment dit-on… ?</b>
                <small>Écris une phrase en français, Claude te la dit en japonais</small>
              </span>
            </button>
            <button type="button" className="help-row" onClick={() => setView('unblock')}>
              <span className="help-key" lang="ja">困</span>
              <span className="help-label fr">
                <b>Je bloque</b>
                <small>Une question pour t'aider à démarrer, puis une amorce</small>
              </span>
            </button>
            {canStarters && (
              <button
                type="button"
                className="help-row"
                onClick={() => {
                  onStarters()
                  onClose()
                }}
              >
                <span className="help-key" lang="ja">書</span>
                <span className="help-label fr">
                  <b>{startersOpen ? 'Masquer les amorces' : 'Amorces de phrase'}</b>
                  <small>{startersOpen ? 'Referme la rangée de débuts de phrase' : 'Des débuts de phrase sur le thème du jour'}</small>
                </span>
              </button>
            )}
            <div className="help-actions">
              <button type="button" className="sketch" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        )}
        {view === 'say' && (
          <SayView
            settings={settings}
            onBack={() => setView('menu')}
            onClose={onClose}
            onAppend={(p) => {
              onAppend(p)
              onClose()
            }}
            onOpenSettings={onOpenSettings}
          />
        )}
        {view === 'unblock' && (
          <UnblockView
            settings={settings}
            text={text}
            topic={topic}
            onClose={onClose}
            onAppend={(p) => {
              onAppend(p)
              onClose()
            }}
            onOpenSettings={onOpenSettings}
          />
        )}
      </div>
    </div>
  )
}

interface SubProps {
  settings: Settings
  onClose: () => void
  onAppend: (phrase: string) => void
  onOpenSettings: () => void
}

function ErrorLine({ error, onOpenSettings }: { error: { text: string; noKey: boolean }; onOpenSettings: () => void }) {
  return (
    <p className="help-error fr" role="alert">
      {error.text}{' '}
      {error.noKey && (
        <button type="button" className="link" onClick={onOpenSettings}>
          Ouvrir les réglages
        </button>
      )}
    </p>
  )
}

function SayView({ settings, onBack, onClose, onAppend, onOpenSettings }: SubProps & { onBack: () => void }) {
  const [french, setFrench] = useState('')
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [results, setResults] = useState<Formulation[]>([])
  const [error, setError] = useState<{ text: string; noKey: boolean } | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function ask() {
    const q = french.trim()
    if (!q || phase === 'loading') return
    setPhase('loading')
    setError(null)
    try {
      setResults(await requestSay(settings, q))
      setPhase('done')
    } catch (e) {
      setError(failureMessage(e))
      setPhase('error')
    }
  }

  return (
    <>
      <h2 className="fr">
        <span lang="ja">訳</span> Comment dit-on… ?
      </h2>
      <label className="help-sub fr" htmlFor="help-say">
        En français, une phrase ou une expression
      </label>
      <textarea
        id="help-say"
        ref={inputRef}
        className="help-input fr"
        rows={2}
        maxLength={MAX_SAY_CHARS}
        value={french}
        placeholder="Je suis fatiguée mais contente"
        onChange={(e) => setFrench(e.target.value)}
      />
      <div className="help-actions">
        <button type="button" className="sketch primary" disabled={!french.trim() || phase === 'loading'} onClick={() => void ask()}>
          {phase === 'loading' ? 'Je cherche…' : 'Dire en japonais'}
        </button>
        <button type="button" className="sketch" onClick={onBack}>
          Retour
        </button>
      </div>
      {phase === 'error' && error && <ErrorLine error={error} onOpenSettings={onOpenSettings} />}
      {phase === 'done' && (
        <>
          {results.map((r, i) => (
            <div className="help-card" key={`${r.ja}-${i}`}>
              <span className="help-ja" lang="ja">
                <Jp text={r.ja} furigana={settings.furiganaFrom} />
              </span>
              {r.reading && (
                <span className="help-reading" lang="ja">
                  {r.reading}
                  {r.level && <span className="help-level fr">{r.level}</span>}
                </span>
              )}
              {!r.reading && r.level && <span className="help-level fr">{r.level}</span>}
              <button type="button" className={i === 0 ? 'sketch primary' : 'sketch'} onClick={() => onAppend(plainText(r.ja))}>
                Ajouter à l'entrée
              </button>
            </div>
          ))}
          <p className="help-sub fr">Un tap sur « Ajouter » place la phrase à la fin de ton entrée.</p>
        </>
      )}
      {phase !== 'done' && phase !== 'error' && (
        <div className="help-actions help-close">
          <button type="button" className="link" onClick={onClose}>
            Fermer
          </button>
        </div>
      )}
    </>
  )
}

function UnblockView({ settings, text, topic, onClose, onAppend, onOpenSettings }: SubProps & { text: string; topic?: string }) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [step, setStep] = useState<1 | 2>(1)
  const [help, setHelp] = useState<Unblock | null>(null)
  const [error, setError] = useState<{ text: string; noKey: boolean } | null>(null)
  const started = useRef(false)

  async function load() {
    setPhase('loading')
    setError(null)
    try {
      setHelp(await requestUnblock(settings, { topic, text }))
      setPhase('ready')
    } catch (e) {
      setError(failureMessage(e))
      setPhase('error')
    }
  }

  useEffect(() => {
    // Un seul appel à l'ouverture (la seconde étape est locale).
    if (started.current) return
    started.current = true
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <h2 className="fr">
        <span lang="ja">困</span> Je bloque
      </h2>
      {phase === 'loading' && <p className="help-sub fr" role="status">Je cherche une question pour toi…</p>}
      {phase === 'error' && error && (
        <>
          <ErrorLine error={error} onOpenSettings={onOpenSettings} />
          <div className="help-actions">
            <button type="button" className="sketch primary" onClick={() => void load()}>
              Réessayer
            </button>
            <button type="button" className="sketch" onClick={onClose}>
              Arrêter
            </button>
          </div>
        </>
      )}
      {phase === 'ready' && help && step === 1 && (
        <>
          <p className="help-sub fr">Étape 1 sur 2 · à ton rythme, tu peux t'arrêter quand tu veux</p>
          <p className="help-quote fr">{help.question}</p>
          <p className="help-sub fr">Réponds-y dans ta tête, même en français.</p>
          <div className="help-actions">
            <button type="button" className="sketch primary" onClick={() => setStep(2)}>
              Une amorce
            </button>
            <button type="button" className="sketch" onClick={onClose}>
              Arrêter
            </button>
          </div>
        </>
      )}
      {phase === 'ready' && help && step === 2 && (
        <>
          <p className="help-sub fr">Étape 2 sur 2</p>
          <p className="help-quote" lang="ja">{help.starter}</p>
          {help.gloss && <p className="help-sub fr">« {help.gloss.replace(/[…\s.]+$/, '')}… » — continue comme tu veux.</p>}
          <div className="help-actions">
            <button type="button" className="sketch primary" onClick={() => onAppend(help.starter)}>
              Écrire à partir de là
            </button>
            <button type="button" className="sketch" onClick={onClose}>
              Arrêter
            </button>
          </div>
        </>
      )}
    </>
  )
}
