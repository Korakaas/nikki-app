import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ConjDaily, QuickReview, RewriteCard } from '../components/AfterCorrection'
import Block from '../components/Block'
import Stamp from '../components/Stamp'
import { earnedStamp } from '../stamps'
import CorrectionView from '../components/CorrectionView'
import Decor from '../components/Decor'
import HelpSheet from '../components/HelpSheet'
import Chevron from '../components/Chevron'
import FormatBlock from '../components/FormatBlock'
import PromptNote from '../components/PromptNote'
import WeekStrip from '../components/WeekStrip'
import { ENTRY_UPDATED, isRunning, runCorrection } from '../corrector'
import { getEntry, listEntries, loadAnki, loadReviews, saveEntry, todayId } from '../db'
import { addDays, countChars, formatDateJa } from '../format'
import { formatOfDay } from '../formats'
import { requestLink } from '../link'
import { pickPrompt } from '../prompts/pick'
import { pickStarters } from '../prompts/starters'
import { Jp, plainText } from '../furigana'
import { goodPoints, streakInfo, timesUsed, wordHistory, writtenDays } from '../stats'
import WelcomeBack from '../components/WelcomeBack'
import { difficultyOf, type Correction, type DailyPrompt, type Entry, type EntryPhoto, type EntrySticker, type Settings } from '../types'

interface Props {
  /** Jour affiché (YYYY-MM-DD) : aujourd'hui ou une page passée. */
  id: string
  onChangeDay: (id: string) => void
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

export default function WritePage({ id, onChangeDay, settings, onOpenSettings }: Props) {
  const today = todayId()
  const isToday = id === today
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [state, setState] = useState<SaveState>('idle')
  const [meta, setMeta] = useState<Meta>({})
  const [busy, setBusy] = useState(() => isRunning(id))
  const [missingKey, setMissingKey] = useState(false)
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null)
  const [days, setDays] = useState<Set<string>>(() => new Set())
  // Changements de sujet automatiques faute de lien possible (1 au plus par jour, pour borner le coût).
  const bridgeRetries = useRef(0)
  const [photos, setPhotos] = useState<EntryPhoto[]>([])
  const [stickers, setStickers] = useState<EntrySticker[]>([])
  const [linkState, setLinkState] = useState<'idle' | 'loading' | 'error'>('idle')
  const entryRef = useRef<Entry | undefined>(undefined)
  const timer = useRef<number | undefined>(undefined)
  const textRef = useRef(text)
  textRef.current = text
  const areaRef = useRef<HTMLTextAreaElement>(null)
  // Les amorces ne s'affichent que si on les demande (bouton « Amorces »), jamais d'elles-mêmes.
  const [showStarters, setShowStarters] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [continueOpen, setContinueOpen] = useState(false)
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null)

  // La feuille grandit avec le texte : la page défile, pas le champ.
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text, loaded])

  useEffect(() => {
    void listEntries().then((all) => setDays(writtenDays(all)))
  }, [])

  useEffect(() => {
    getEntry(id).then((entry) => {
      entryRef.current = entry
      setText(entry?.text ?? '')
      setMeta(metaOf(entry))
      setPrompt(entry?.prompt ?? null)
      setPhotos(entry?.photos ?? [])
      setStickers(entry?.stickers ?? [])
      setLinkState('idle')
      setShowStarters(false)
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
      format: previous?.format ?? formatOfDay(id),
    }
    await saveEntry(entry)
    entryRef.current = entry
    setState('saved')
    setDays((prev) => {
      const has = prev.has(id)
      const wants = value.trim() !== ''
      if (has === wants) return prev
      const next = new Set(prev)
      if (wants) next.add(id)
      else next.delete(id)
      return next
    })
  }

  /** Insère une amorce dans l'entrée, puis place le curseur à la fin pour continuer à écrire. */
  function insertStarter(starter: string) {
    setShowStarters(false)
    onChange(starter)
    requestAnimationFrame(() => {
      const area = areaRef.current
      if (!area) return
      area.focus()
      area.setSelectionRange(starter.length, starter.length)
    })
  }

  /** Place une phrase à la fin de l'entrée (sur une nouvelle ligne si l'entrée n'est pas vide), curseur après. */
  function appendPhrase(phrase: string) {
    const current = textRef.current
    const next = current.trim() === '' ? phrase : current + (current.endsWith('\n') ? '' : '\n') + phrase
    setShowStarters(false)
    onChange(next)
    requestAnimationFrame(() => {
      const area = areaRef.current
      if (!area) return
      area.focus()
      area.setSelectionRange(next.length, next.length)
    })
  }

  /** Propose une idée (ou une autre) et la range dans l'entrée du jour. */
  async function suggest(next: number, part?: 'grammar' | 'words') {
    const all = await listEntries()
    const recentEntries = all.slice(0, 14)
    const proposed = recentEntries.filter((e) => !e.prompt?.themeOnly)
    const recent = proposed
      .map((e) => e.prompt?.grammar.pattern)
      .filter((p): p is string => Boolean(p))
    const recentWords = proposed.slice(0, 10).flatMap((e) => e.prompt?.words.map((w) => w.ja) ?? [])
    const library = await loadAnki().catch(() => null)
    // Le point à viser du dernier bilan reste proposé 3 jours après le bilan,
    // ou jusqu'à ce qu'il ait été bien employé une fois.
    const review = (await loadReviews().catch(() => []))[0]
    const fresh = review && id >= review.to && id <= addDays(review.to, 3)
    const since = review ? goodPoints(all.filter((e) => e.id >= review.to)) : []
    const focus =
      review && fresh && timesUsed(review.focus.pattern, since) < 1 ? review.focus : null
    // « Changer » : le sujet reste le même ; ce qui vient d'être proposé aujourd'hui ne revient pas aussitôt.
    const keep = part && prompt ? prompt : null
    const drawn = pickPrompt({
      level: difficultyOf(settings),
      dateId: id,
      variant: next,
      recentPatterns: keep && part === 'grammar' ? [...recent, keep.grammar.pattern, ...(keep.prevGrammar ?? [])] : recent,
      recentWords:
        keep && part === 'words' ? [...recentWords, ...keep.words.map((w) => w.ja), ...(keep.prevWords ?? [])] : recentWords,
      currentTopic: prompt?.topic.ja,
      fixedTopic: keep?.topic.ja,
      recentTopics: recentEntries
        .map((e) => e.prompt?.topic.ja)
        .filter((t): t is string => Boolean(t)),
      library,
      good: goodPoints(all),
      focus,
      wordHistory: wordHistory(all),
    })
    let idea = drawn
    if (keep) {
      const { link: _oldLink, ...rest } = keep
      void _oldLink
      idea =
        part === 'grammar'
          ? { ...rest, variant: next, grammar: drawn.grammar, prevGrammar: [...(keep.prevGrammar ?? []), keep.grammar.pattern].slice(-10) }
          : { ...rest, variant: next, words: drawn.words, prevWords: [...(keep.prevWords ?? []), ...keep.words.map((w) => w.ja)].slice(-12) }
    }
    if (prompt?.themeOnly) idea = { ...idea, themeOnly: true }
    setPrompt(idea)
    setLinkState('idle')
    await savePrompt(idea)
    void fetchLink(idea, !part)
  }

  /** Un défi de traduction qui relie le sujet, la grammaire et les mots (facultatif, en arrière-plan). */
  async function fetchLink(idea: DailyPrompt, mayChangeTopic = false) {
    if (!settings.apiKey || !navigator.onLine) return
    const same = (p?: DailyPrompt | null) =>
      !!p && p.variant === idea.variant && p.topic.ja === idea.topic.ja
    setLinkState('loading')
    try {
      const link = await requestLink(idea, settings)
      if (entryRef.current?.id !== id || !same(entryRef.current?.prompt)) return
      // Pas de lien naturel : on change de sujet plutôt que de forcer (une seule fois par idée de départ).
      if (link.fits === false && mayChangeTopic && bridgeRetries.current < 1 && !idea.themeOnly) {
        bridgeRetries.current += 1
        void suggest(idea.variant + 1)
        return
      }
      const withLink = { ...idea, link }
      setPrompt((p) => (same(p) ? withLink : p))
      setLinkState('idle')
      await savePrompt(withLink)
    } catch {
      if (same(entryRef.current?.prompt)) setLinkState('error')
    }
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

  /** Photos et autocollants : enregistrés tout de suite, avec le texte en cours. */
  async function saveDecor(nextPhotos: EntryPhoto[], nextStickers: EntrySticker[]) {
    setPhotos(nextPhotos)
    setStickers(nextStickers)
    window.clearTimeout(timer.current)
    timer.current = undefined
    const now = Date.now()
    const previous = entryRef.current
    const entry: Entry = {
      ...previous,
      id,
      text: textRef.current,
      photos: nextPhotos,
      stickers: nextStickers,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    }
    if (nextPhotos.length === 0) delete entry.photos
    if (nextStickers.length === 0) delete entry.stickers
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

  // Balayage horizontal : vers la droite = jour précédent, vers la gauche = jour suivant.
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    const area = areaRef.current
    // Pas de balayage depuis le bord (geste « retour » d'Android) ni pendant une sélection de texte.
    const selecting = !!area && area.selectionStart !== area.selectionEnd
    const edge = t.clientX < 24 || t.clientX > window.innerWidth - 24
    swipe.current =
      e.touches.length === 1 && !selecting && !edge
        ? { x: t.clientX, y: t.clientY, t: Date.now() }
        : null
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Date.now() - start.t > 700) return
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return
    if (dx > 0) onChangeDay(addDays(id, -1))
    else if (!isToday) onChangeDay(addDays(id, 1))
  }

  // Les amorces suivent le thème du sujet du jour ; sans sujet, des amorces générales.
  const starters = useMemo(() => pickStarters(prompt?.topic.ja, id), [prompt?.topic.ja, id])

  if (!loaded) return null

  const hasText = text.trim() !== ''
  const stale = meta.correction ? meta.correction.sourceText !== text : false
  // S18.6 : une entrée corrigée dont le texte n'a pas bougé n'a plus besoin de la barre du bas
  // (compteur, « Aide », « Corriger de nouveau ») : elle revient dès qu'on modifie le texte,
  // ou si une correction est en cours, en attente ou en erreur.
  const showDock = !(meta.correction && hasText && !stale && !busy && !meta.pending && !meta.error)

  return (
    <section
      className="page write"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => (swipe.current = null)}
    >
      <header className="page-header">
        <div className="day-nav">
          <button
            type="button"
            className="day-arrow"
            aria-label="Jour précédent"
            onClick={() => onChangeDay(addDays(id, -1))}
          >
            <Chevron dir="left" />
          </button>
          <h1 lang="ja">
            <span className="date-ink">
              {formatDateJa(id, id.slice(0, 4) !== today.slice(0, 4))}
            </span>
          </h1>
          <button
            type="button"
            className="day-arrow"
            aria-label="Jour suivant"
            disabled={isToday}
            onClick={() => onChangeDay(addDays(id, 1))}
          >
            <Chevron dir="right" />
          </button>
        </div>
        <p className="muted">
          {state === 'saving' && 'Enregistrement…'}
          {state === 'saved' && 'Enregistré sur ce téléphone'}
          {state === 'idle' && ' '}
        </p>
        <WeekStrip
          today={today}
          selected={id}
          written={days}
          streak={streakInfo(days, today).current}
          paused={streakInfo(days, today).paused}
          onSelect={onChangeDay}
        />
        {!isToday && (
          <button type="button" className="link muted-link" onClick={() => onChangeDay(today)}>
            Revenir à aujourd'hui
          </button>
        )}
      </header>

      {isToday && loaded && (
        <WelcomeBack
          lastDay={streakInfo(days, today).paused ? streakInfo(days, today).lastDay : null}
          onStart={() => areaRef.current?.focus()}
        />
      )}

      {prompt ? (
        <PromptNote
          prompt={prompt}
          furigana={settings.furiganaFrom}
          text={text}
          linkState={linkState}
          onLink={settings.apiKey ? () => void fetchLink(prompt) : undefined}
          onAnother={() => void suggest(prompt.variant + 1)}
          onChangeGrammar={() => void suggest(prompt.variant + 1, 'grammar')}
          onChangeWords={() => void suggest(prompt.variant + 1, 'words')}
          onToggleThemeOnly={() => {
            const next: DailyPrompt = { ...prompt, themeOnly: !prompt.themeOnly }
            if (!next.themeOnly) delete next.themeOnly
            setPrompt(next)
            void savePrompt(next)
          }}
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

      <FormatBlock id={id} furigana={settings.furiganaFrom} text={text} onStarter={insertStarter} />

      <div className="sheet-wrap">
        <textarea
          ref={areaRef}
          className="sheet editor"
          lang="ja"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isToday ? '今日はどんな一日でしたか？' : 'この日はどんな一日でしたか？'}
          aria-label="Entrée du journal du jour"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {/* Tampon de professeur (S18.19) : en haut à droite du texte, juste sous le thème du jour ; il peut recouvrir légèrement le texte. */}
        {meta.correction &&
          (() => {
            const kind = earnedStamp({ text, correction: meta.correction, prompt })
            return kind ? <Stamp kind={kind} size={64} tilt={-9} className="sheet-stamp sheet-stamp-top" /> : null
          })()}
      </div>

      <Decor photos={photos} stickers={stickers} onChange={(p, s) => void saveDecor(p, s)} />

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
          entryId={id}
          settings={settings}
          onOpenSettings={onOpenSettings}
        />
      )}

      {/* « Pour continuer » (S18.14) : replié ; chaque ligne fonctionne comme l'ancienne carte. Le bloc se cache tout seul s'il est vide. */}
      {meta.correction && hasText && (
        <Block
          role="train"
          ja="習"
          title="Pour continuer"
          className="continue-block"
          keepMounted
          open={continueOpen}
          onToggle={() => setContinueOpen((v) => !v)}
        >
          <ul className="rows">
            {!stale && <RewriteCard correction={meta.correction} />}
            <QuickReview currentId={id} correctionKey={meta.correction.createdAt} furigana={settings.furiganaFrom} />
            <ConjDaily correctionKey={meta.correction.createdAt} />
          </ul>
        </Block>
      )}

      {/* Barre du bas : le compteur et « Corriger » restent sous le pouce, même quand la page défile.
          Masquée quand l'entrée est corrigée et que le texte n'a pas changé (showDock). */}
      {showDock && (
      <div className="write-dock">
        {!hasText && showStarters && (
          <div className="starters" lang="ja" role="group" aria-label="Amorces de phrase">
            {starters.map((st) => (
              <button
                key={st.ja}
                type="button"
                className="sketch starter"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertStarter(plainText(st.ja))}
              >
                <span className="starter-ja">
                  <Jp text={st.ja} furigana={settings.furiganaFrom} />
                </span>
                <span className="starter-fr fr">{st.fr}</span>
              </button>
            ))}
          </div>
        )}
        <div className="dock-bar">
          <span className="counter muted">{countChars(text)} 文字</span>
          <button
            type="button"
            className="sketch dock-help fr"
            aria-haspopup="dialog"
            aria-expanded={showHelp}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowHelp(true)}
          >
            Aide
          </button>
          <button
            type="button"
            className="sketch primary"
            disabled={!hasText || busy}
            // Garde le clavier ouvert au toucher : sinon la page se réorganise et le tap est perdu.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              areaRef.current?.blur()
              void onCorrect()
            }}
          >
            {busy
              ? 'Correction en cours…'
              : meta.correction
                ? 'Corriger de nouveau'
                : 'Corriger'}
          </button>
        </div>
      </div>
      )}
      {showHelp && (
        <HelpSheet
          settings={settings}
          text={text}
          topic={prompt ? `${plainText(prompt.topic.ja)} (${prompt.topic.fr})` : undefined}
          canStarters={!hasText}
          startersOpen={showStarters}
          onClose={() => setShowHelp(false)}
          onAppend={appendPhrase}
          onStarters={() => setShowStarters((v) => !v)}
          onOpenSettings={onOpenSettings}
        />
      )}
    </section>
  )
}
