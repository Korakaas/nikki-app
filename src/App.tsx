import { useEffect, useState } from 'react'
import { processPending } from './corrector'
import { loadSettings, saveSettings } from './db'
import { DEFAULT_SETTINGS, type Settings } from './types'
import WritePage from './pages/WritePage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

type Tab = 'write' | 'history' | 'settings'

const TABS: { id: Tab; ja: string; fr: string }[] = [
  { id: 'write', ja: '書く', fr: 'Écrire' },
  { id: 'history', ja: '記録', fr: 'Historique' },
  { id: 'settings', ja: '設定', fr: 'Réglages' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('write')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)

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

  function updateSettings(next: Settings) {
    setSettings(next)
    void saveSettings(next)
  }

  if (!ready) return <div className="loading">…</div>

  return (
    <div className="app">
      <main className="content">
        {tab === 'write' && (
          <WritePage
            settings={settings}
            onOpenSettings={() => setTab('settings')}
          />
        )}
        {tab === 'history' && <HistoryPage settings={settings} />}
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
