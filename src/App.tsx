import { useEffect, useState } from 'react'
import { processPending } from './corrector'
import { loadSettings, saveSettings, todayId } from './db'
import { DEFAULT_SETTINGS, type Settings } from './types'
import WritePage from './pages/WritePage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import StatsPage from './pages/StatsPage'
import BackupReminder from './components/BackupReminder'

type Tab = 'write' | 'history' | 'stats' | 'settings'

const TABS: { id: Tab; ja: string; fr: string }[] = [
  { id: 'write', ja: '書く', fr: 'Écrire' },
  { id: 'history', ja: '記録', fr: 'Historique' },
  { id: 'stats', ja: '統計', fr: 'Stats' },
  { id: 'settings', ja: '設定', fr: 'Réglages' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('write')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const [day, setDay] = useState(() => todayId())

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

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .finally(() => setReady(true))
  }, [])

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

  function updateSettings(next: Settings) {
    setSettings(next)
    void saveSettings(next)
  }

  if (!ready) return <div className="loading">…</div>

  return (
    <div className="app">
      <main className="content">
        {tab === 'write' && <BackupReminder settings={settings} />}
        {tab === 'write' && (
          <WritePage
            key={day}
            id={day}
            onChangeDay={setDay}
            settings={settings}
            onOpenSettings={() => setTab('settings')}
          />
        )}
        {tab === 'history' && <HistoryPage
            settings={settings}
            onOpenDay={(id) => {
              setDay(id)
              setTab('write')
            }}
          />}
        {tab === 'stats' && <StatsPage settings={settings} />}
        {tab === 'settings' && (
          <SettingsPage settings={settings} onChange={updateSettings} />
        )}
      </main>
      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
            aria-current={t.id === tab ? 'page' : undefined}
          >
            <span className="tab-ja" lang="ja" aria-hidden="true">
              {t.ja}
            </span>
            <span className="tab-fr">{t.fr}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
