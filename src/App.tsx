import { useCallback, useEffect, useRef, useState } from 'react'
import { processPending } from './corrector'
import { DATA_EVENT, loadSettings, saveSettings, todayId } from './db'
import { runAchievementSync } from './achievementsRun'
import { protectStorage } from './storage'
import type { Achievement } from './achievements'
import Celebration from './components/Celebration'
import { DEFAULT_SETTINGS, paletteOf, type Settings } from './types'
import WritePage from './pages/WritePage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import StatsPage from './pages/StatsPage'
import PracticePage from './pages/PracticePage'
import BackupReminder from './components/BackupReminder'
import CapNotice from './components/CapNotice'

type Tab = 'write' | 'history' | 'stats' | 'practice' | 'settings'

const TABS: { id: Tab; ja: string; fr: string }[] = [
  { id: 'write', ja: '書く', fr: 'Écrire' },
  { id: 'history', ja: '記録', fr: 'Historique' },
  { id: 'stats', ja: '統計', fr: 'Stats' },
  { id: 'practice', ja: '練習', fr: 'Exercices' },
  { id: 'settings', ja: '設定', fr: 'Réglages' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('write')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const [day, setDay] = useState(() => todayId())
  // Succès tout juste débloqués, à célébrer un par un ; la célébration attend qu'on ait fini de taper.
  const [queue, setQueue] = useState<Achievement[]>([])
  const [typing, setTyping] = useState(false)
  // Clavier du téléphone ouvert : la hauteur de l'écran rétrécit (viewport « interactive-widget=resizes-content »).
  const [keyboard, setKeyboard] = useState(false)
  const checking = useRef(false)

  // Retour arrière (geste Android) : revient à l'écran précédent au lieu de quitter l'appli.
  const tabRef = useRef<Tab>('write')
  tabRef.current = tab
  const go = useCallback((next: Tab) => {
    if (tabRef.current === next) return
    window.history.pushState({ nikkiTab: next }, '')
    tabRef.current = next
    setTab(next)
  }, [])

  useEffect(() => {
    window.history.replaceState({ nikkiTab: 'write' }, '')
    const onPop = (e: PopStateEvent) => {
      const t = (e.state as { nikkiTab?: Tab } | null)?.nikkiTab
      setTab(t && TABS.some((x) => x.id === t) ? t : 'write')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const checkAchievements = useCallback(async () => {
    if (checking.current) return
    checking.current = true
    try {
      const { fresh } = await runAchievementSync()
      if (fresh.length) setQueue((q) => [...q, ...fresh.filter((f) => !q.some((x) => x.id === f.id))])
    } catch {
      /* les succès ne doivent jamais gêner l'écriture */
    } finally {
      checking.current = false
    }
  }, [])

  useEffect(() => {
    let width = window.innerWidth
    let tallest = window.innerHeight
    const onResize = () => {
      if (window.innerWidth !== width) {
        // Rotation de l'écran : on repart de la nouvelle hauteur.
        width = window.innerWidth
        tallest = window.innerHeight
      } else {
        tallest = Math.max(tallest, window.innerHeight)
      }
      setKeyboard(window.innerHeight < tallest - 120)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const field = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')
    const onIn = (e: FocusEvent) => field(e.target) && setTyping(true)
    const onOut = (e: FocusEvent) => field(e.target) && setTyping(false)
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    window.addEventListener(DATA_EVENT, checkAchievements)
    return () => {
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
      window.removeEventListener(DATA_EVENT, checkAchievements)
    }
  }, [checkAchievements])

  // Appli restée ouverte pendant la nuit : si on était sur « aujourd'hui », on passe au nouveau jour.
  useEffect(() => {
    let last = todayId()
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const now = todayId()
      if (now === last) return
      setDay((d) => (d === last ? now : d))
      last = now
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Protège les données du nettoyage automatique (S16.4) : une demande silencieuse à chaque ouverture,
  // Chrome ne l'accorde souvent qu'une fois l'appli installée et utilisée plusieurs fois.
  useEffect(() => {
    void protectStorage()
  }, [])

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .finally(() => {
        setReady(true)
        void checkAchievements()
      })
  }, [checkAchievements])

  // Un changement d'onglet est un bon moment pour vérifier les succès.
  useEffect(() => {
    if (ready) void checkAchievements()
  }, [tab, ready, checkAchievements])

  // Envoie les corrections demandées hors-ligne dès que le réseau et la clé sont là.
  // Le délai évite de partir avec une clé à moitié saisie dans les réglages.
  useEffect(() => {
    if (!ready || !settings.apiKey) return
    const run = () => void processPending(settings)
    const timeout = window.setTimeout(run, 1500)
    window.addEventListener('online', run)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('online', run)
    }
  }, [ready, settings])

  // Thème : posé sur <html> (le CSS s'en sert), recopié dans localStorage pour être
  // appliqué avant l'affichage au prochain lancement, et couleur de la barre du navigateur.
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = settings.theme
    try {
      localStorage.setItem('nikki-theme', settings.theme)
    } catch {
      /* stockage indisponible : le thème reste appliqué pour cette session */
    }
    document.querySelectorAll('meta[data-nikki-theme]').forEach((m) => m.remove())
    if (settings.theme !== 'auto') {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = settings.theme === 'dark' ? '#211f1c' : '#f1ecdd'
      meta.setAttribute('data-nikki-theme', '')
      document.head.prepend(meta)
    }
  }, [settings.theme])

  // Palette des pastilles : posée sur <html> (le CSS s'en sert) et recopiée dans localStorage
  // pour être appliquée avant l'affichage au prochain lancement.
  useEffect(() => {
    const root = document.documentElement
    const palette = paletteOf(settings)
    if (palette === 'matcha') delete root.dataset.palette
    else root.dataset.palette = palette
    try {
      localStorage.setItem('nikki-palette', palette)
    } catch {
      /* stockage indisponible : la palette reste appliquée pour cette session */
    }
  }, [settings])

  function updateSettings(next: Settings) {
    setSettings(next)
    void saveSettings(next)
  }

  if (!ready) return <div className="loading">…</div>

  return (
    <div className="app">
      <main className="content">
        {tab === 'write' && <BackupReminder settings={settings} />}
        {tab === 'write' && <CapNotice settings={settings} />}
        {tab === 'write' && (
          <WritePage
            key={day}
            id={day}
            onChangeDay={setDay}
            settings={settings}
            onOpenSettings={() => go('settings')}
          />
        )}
        {tab === 'history' && <HistoryPage
            settings={settings}
            onOpenDay={(id) => {
              setDay(id)
              go('write')
            }}
          />}
        {tab === 'stats' && <StatsPage settings={settings} />}
        {tab === 'practice' && <PracticePage settings={settings} />}
        {tab === 'settings' && (
          <SettingsPage settings={settings} onChange={updateSettings} />
        )}
      </main>
      {queue.length > 0 && !typing && (
        <Celebration achievement={queue[0]} onClose={() => setQueue((q) => q.slice(1))} />
      )}
      {/* Clavier ouvert pendant la frappe : les onglets s'effacent (plus de place pour écrire) et la barre « Corriger » reste au-dessus du clavier. */}
      {!(tab === 'write' && typing && keyboard) && (
      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? 'tab active' : 'tab'}
            onClick={() => go(t.id)}
            aria-current={t.id === tab ? 'page' : undefined}
          >
            <span className="tab-ja" lang="ja" aria-hidden="true">
              {t.ja}
            </span>
            <span className="tab-fr">{t.fr}</span>
          </button>
        ))}
      </nav>
      )}
    </div>
  )
}
