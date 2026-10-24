import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import CorrectionView from '../components/CorrectionView'
import PromptNote from '../components/PromptNote'
import { ENTRY_UPDATED, isRunning, runCorrection } from '../corrector'
import { getEntry, listEntries, saveEntry, todayId } from '../db'
import { countChars, formatDateJa } from '../format'
import { pickPrompt } from '../prompts/pick'
import type { Correction, DailyPrompt, Entry, Settings } from '../types'

interface Props {
  settings: Settings
  onOpenSettings: () => void
}

type SaveState = 'idle' | 'saving' | 'saved'

interface Meta {
  correction?: Correction | null
  pending?: boolean
  error?: string
}

function metaOf(entry?: Entry): Meta {
  return {
    correction: entry?.correction,
    pending: entry?.pendingCorrection,
    error: entry?.correctionError,
  }
}

export default function WritePage({ settings, onOpenSettings }: Props) {
  const [id] = useState(() => todayId())
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [state, setState] = useState<SaveState>('idle')
  const [meta, setMeta] = useState<Meta>({})
  const [busy, setBusy] = useState(() => isRunning(id))
  const [missingKey, setMissingKey] = useState(false)
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null)
  const entryRef = useRef<Entry | undefined>(undefined)
  const timer = useRef<number | undefined>(undefined)
  const textRef = useRef(text)
  textRef.current = text
  const areaRef = useRef<HTMLTextAreaElement>(null)

  // La feuille grandit avec le texte : la page défile, pas le champ.
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text, loaded])

  useEffect(() => {
    getEntry(id).then((entry) => {
      entryRef.current = entry
      setText(entry?.text ?? '')
      setMeta(metaOf(entry))
      setPrompt(entry?.prompt ?? null)
      setLoaded(true)
    })
  }, [id])

  // Une correction arrive (ou échoue) en arrière-plan : on met à jour l'affichage.
  useEffect(() => {
    const onUpdated = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) return
      void getEntry(id).then((entry) => {
        if (!entry) return
        entryRef.current = entry
        setMeta(metaOf(entry))
        setBusy(isRunning(id))
      })
    }
    window.addEventListener(ENTRY_UPDATED, onUpdated)
    return () => window.removeEventListener(ENTRY_UPDATED, onUpdated)
  }, [id])

  async function persist(value: string) {
    const now = Date.now()
    const previous = entryRef.current
    if (!previous && value.trim() === '') {
      setState('idle')
      return
    }
    const entry: Entry = {
      ...previous,
      id,
      text: value,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    }
    await saveEntry(entry)
    entryRef.current = entry
    setState('saved')
  }

  /** Propose une idée (ou une autre) et la range dans l'entrée du jour. */
  async function suggest(next: number) {
    const recent = (await listEntries())
      .slice(0, 14)
      .map((e) => e.prompt?.grammar.pattern)
      .filter((p): p is string => Boolean(p))
    const idea = pickPrompt({
      level: settings.targetLevel,
      dateId: id,
      variant: next,
      recentPatterns: recent,
      currentTopic: prompt?.topic.ja,
    })
    setPrompt(idea)
    await savePrompt(idea)
  }

  async function savePrompt(idea: DailyPrompt | null) {
    window.clearTimeout(timer.current)
    timer.current = undefined
    const now = Date.now()
    const previous = entryRef.current
    const value = textRef.current
    if (!previous && value.trim() === '' && !idea) return
    const entry: Entry = {
      ...previous,
      id,
      text: value,
      prompt: idea,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    }
    if (!idea) delete entry.prompt
    await saveEntry(entry)
    entryRef.current = entry
  }

  function onChange(value: string) {
    setText(value)
    setState('saving')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void persist(value), 600)
  }

  // Sauvegarde immédiate si on quitte l'écran avant la fin du délai.
  useEffect(() => {
    const flush = () => {
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current)
        timer.current = undefined
        void persist(textRef.current)
      }
    }
    document.addEventListener('visibilitychange', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onCorrect() {
    window.clearTimeout(timer.current)
    timer.current = undefined
    await persist(textRef.current)
    if (!textRef.current.trim()) return

    if (!settings.apiKey) {
      setMissingKey(true)
      return
    }
    setMissingKey(false)

    const current = entryRef.current
    if (!navigator.onLine) {
      // Pas de réseau : la demande attend la prochaine ouverture connectée.
      if (current) {
        const next: Entry = { ...current, pendingCorrection: true }
        delete next.correctionError
        await saveEntry(next)
        entryRef.current = next
        setMeta(metaOf(next))
      }
      return
    }

    // On efface l'ancien message d'erreur pendant la nouvelle tentative.
    setMeta((m) => ({ ...m, error: undefined, pending: false }))
    setBusy(true)
    await runCorrection(id, settings)
    setBusy(false)
  }

  if (!loaded) return null

  const hasText = text.trim() !== ''
  const stale = meta.correction ? meta.correction.sourceText !== text : false

  return (
    <section className="page write">
      <header className="page-header">
        <h1 lang="ja">
          <span className="date-ink">{formatDateJa(id)}</span>
        </h1>
        <p className="muted">
          {state === 'saving' && 'Enregistrement…'}
          {state === 'saved' && 'Enregistré sur ce téléphone'}
          {state === 'idle' && ' '}
        </p>
      </header>

      {prompt ? (
        <PromptNote
          prompt={prompt}
          furigana={settings.furiganaFrom}
          onAnother={() => void suggest(prompt.variant + 1)}
          onRemove={() => {
            setPrompt(null)
            void savePrompt(null)
          }}
        />
      ) : (
        <button
          type="button"
          className="sketch idea-button"
          onClick={() => void suggest(0)}
        >
          Besoin d'une idée ?
        </button>
      )}

      <textarea
        ref={areaRef}
        className="sheet editor"
        lang="ja"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="今日はどんな一日でしたか？"
        aria-label="Entrée du journal du jour"
        autoFocus
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />

      <p className="counter muted">{countChars(text)} 文字</p>

      <div className="actions">
        <button
          type="button"
          className="sketch primary"
          disabled={!hasText || busy}
          onClick={() => void onCorrect()}
        >
          {busy
            ? 'Correction en cours…'
            : meta.correction
              ? 'Corriger de nouveau'
              : 'Corriger'}
        </button>
      </div>

      {missingKey && (
        <p className="problem" role="alert">
          Pour corriger, ajoute ta clé API dans les réglages.{' '}
          <button type="button" className="link" onClick={onOpenSettings}>
            Ouvrir les réglages
          </button>
        </p>
      )}
      {meta.pending && !busy && (
        <p className="notice" role="status">
          Pas de réseau pour l'instant. La correction partira à la prochaine
          ouverture de l'appli avec du réseau.
        </p>
      )}
      {meta.error && !busy && (
        <p className="problem" role="alert">
          {meta.error}
        </p>
      )}

      {meta.correction && hasText && (
        <CorrectionView
          correction={meta.correction}
          furigana={settings.furiganaFrom}
          stale={stale}
        />
      )}
    </section>
  )
}
