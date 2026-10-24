import { useRef, useState } from 'react'
import { listEntries, saveEntry, todayId } from '../db'
import type { Entry, FuriganaFrom, Settings } from '../types'

interface Props {
  settings: Settings
  onChange: (next: Settings) => void
}

const FURIGANA_OPTIONS: { value: FuriganaFrom; label: string }[] = [
  { value: 'all', label: 'Tous les kanji' },
  { value: 'N3', label: 'Mots N3 et au-dessus (N3, N2, N1)' },
  { value: 'N2', label: 'Mots N2 et au-dessus (N2, N1)' },
  { value: 'N1', label: 'Mots N1 uniquement' },
  { value: 'none', label: 'Jamais' },
]

export default function SettingsPage({ settings, onChange }: Props) {
  const [showKey, setShowKey] = useState(false)
  const [message, setMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  function patch(partial: Partial<Settings>) {
    onChange({ ...settings, ...partial })
  }

  async function exportBackup() {
    const entries = await listEntries()
    const blob = new Blob([JSON.stringify({ version: 1, entries }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nikki-sauvegarde-${todayId()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage(`${entries.length} entrée(s) exportée(s).`)
  }

  async function importBackup(file: File) {
    try {
      const data = JSON.parse(await file.text()) as { entries?: Entry[] }
      if (!Array.isArray(data.entries)) throw new Error('format')
      const existing = new Map((await listEntries()).map((e) => [e.id, e]))
      let imported = 0
      for (const entry of data.entries) {
        if (typeof entry?.id !== 'string' || typeof entry.text !== 'string') continue
        const current = existing.get(entry.id)
        if (!current || current.updatedAt < entry.updatedAt) {
          await saveEntry(entry)
          imported++
        }
      }
      setMessage(`${imported} entrée(s) importée(s).`)
    } catch {
      setMessage('Fichier de sauvegarde invalide.')
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Réglages</h1>
      </header>

      <div className="field">
        <label htmlFor="level">Niveau visé</label>
        <select
          id="level"
          value={settings.targetLevel}
          onChange={(e) =>
            patch({ targetLevel: e.target.value as Settings['targetLevel'] })
          }
        >
          <option value="N4">N4</option>
          <option value="N3">N3</option>
        </select>
        <p className="hint">
          Utilisé pour les prompts du jour et la difficulté des explications.
        </p>
      </div>

      <div className="field">
        <label htmlFor="furigana">Furigana dans les corrections</label>
        <select
          id="furigana"
          value={settings.furiganaFrom}
          onChange={(e) => patch({ furiganaFrom: e.target.value as FuriganaFrom })}
        >
          {FURIGANA_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="hint">
          Les mots plus faciles que ce seuil s'affichent sans lecture.
        </p>
      </div>

      <div className="field">
        <label htmlFor="apikey">Clé API Claude</label>
        <div className="row">
          <input
            id="apikey"
            type={showKey ? 'text' : 'password'}
            value={settings.apiKey}
            onChange={(e) => patch({ apiKey: e.target.value.trim() })}
            placeholder="sk-ant-…"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" onClick={() => setShowKey((v) => !v)}>
            {showKey ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        <p className="hint">
          Stockée uniquement sur ce téléphone. Elle n'est envoyée qu'à Anthropic, pour la correction.
        </p>
      </div>

      <div className="field">
        <label htmlFor="model">Modèle</label>
        <input
          id="model"
          type="text"
          value={settings.model}
          onChange={(e) => patch({ model: e.target.value.trim() })}
          spellCheck={false}
        />
      </div>

      <div className="field">
        <span className="label">Sauvegarde</span>
        <div className="row">
          <button type="button" onClick={() => void exportBackup()}>
            Exporter
          </button>
          <button type="button" onClick={() => fileInput.current?.click()}>
            Importer
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importBackup(file)
              e.target.value = ''
            }}
          />
        </div>
        <p className="hint">
          Tes entrées ne vivent que sur ce téléphone : exporte-les de temps en
          temps pour ne rien perdre.
        </p>
        {message && <p className="notice">{message}</p>}
      </div>
    </section>
  )
}
