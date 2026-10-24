import { useEffect, useRef, useState } from 'react'
import { emptyLibrary, mergeExport, parseAnkiExport } from '../anki'
import { clearAnki, listEntries, loadAnki, saveAnki, saveEntry, todayId } from '../db'
import type { AnkiLibrary, Entry, FuriganaFrom, Settings, Theme } from '../types'

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

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Automatique (comme le téléphone)' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
]

export default function SettingsPage({ settings, onChange }: Props) {
  const [showKey, setShowKey] = useState(false)
  const [message, setMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const ankiInput = useRef<HTMLInputElement>(null)
  const [anki, setAnki] = useState<AnkiLibrary | null>(null)
  // Dernière version connue : plusieurs cases cochées coup sur coup partent de la même base.
  const ankiRef = useRef<AnkiLibrary | null>(null)
  const setLibrary = (lib: AnkiLibrary | null) => {
    ankiRef.current = lib
    setAnki(lib)
  }
  const [ankiMessage, setAnkiMessage] = useState('')

  useEffect(() => {
    void loadAnki()
      .then(setLibrary)
      .catch(() => setLibrary(null))
  }, [])

  async function importAnki(files: FileList) {
    let lib = ankiRef.current ?? emptyLibrary()
    const notes: string[] = []
    let added = 0
    for (const file of Array.from(files)) {
      try {
        const parsed = parseAnkiExport(await file.text())
        const count = parsed.grammar.length + parsed.words.length
        if (count === 0) {
          notes.push(`${file.name} : rien de reconnu.`)
          continue
        }
        lib = mergeExport(lib, parsed)
        added += count
      } catch {
        notes.push(`${file.name} : fichier illisible.`)
      }
    }
    if (added > 0) {
      setLibrary(lib)
      await saveAnki(lib)
      notes.unshift(
        `${lib.grammar.length} point(s) de grammaire et ${lib.words.length} mot(s) au total.`,
      )
    }
    setAnkiMessage(notes.join(' '))
  }

  async function toggleDeck(name: string, enabled: boolean) {
    const current = ankiRef.current
    if (!current) return
    const next = {
      ...current,
      decks: current.decks.map((d) => (d.name === name ? { ...d, enabled } : d)),
    }
    setLibrary(next)
    await saveAnki(next)
  }

  async function removeAnki() {
    if (!window.confirm('Retirer les cartes Anki importées ? Tes entrées ne changent pas.')) return
    await clearAnki()
    setLibrary(null)
    setAnkiMessage('Cartes Anki retirées.')
  }

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
        <label htmlFor="theme">Apparence</label>
        <select
          id="theme"
          value={settings.theme}
          onChange={(e) => patch({ theme: e.target.value as Theme })}
        >
          {THEME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
        <span className="label">Cartes Anki</span>
        {anki && anki.decks.length > 0 && (
          <ul className="deck-list">
            {anki.decks.map((d) => (
              <li key={d.name}>
                <label>
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) => void toggleDeck(d.name, e.target.checked)}
                  />
                  <span>
                    {d.name.split('::').pop()}
                    <span className="fr">
                      {' '}
                      — {d.count} {d.kind === 'grammar' ? 'points' : 'mots'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="row">
          <button type="button" onClick={() => ankiInput.current?.click()}>
            {anki ? 'Réimporter' : 'Importer un export'}
          </button>
          {anki && (
            <button type="button" className="danger" onClick={() => void removeAnki()}>
              Retirer
            </button>
          )}
          <input
            ref={ankiInput}
            type="file"
            accept=".txt,text/plain,text/tab-separated-values"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) void importAnki(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
        <p className="hint">
          {anki
            ? `Dernier import : ${new Date(anki.importedAt).toLocaleDateString('fr-FR')}. `
            : ''}
          Dans Anki : Fichier → Exporter → « Notes en texte brut », avec le nom du
          deck. Pour ne reprendre que ce que tu as déjà vu, cherche{' '}
          <code>-is:new</code> dans le navigateur, sélectionne tout, puis Notes →
          Exporter les notes. Les idées du jour mélangent ces cartes avec la liste
          intégrée.
        </p>
        {ankiMessage && <p className="notice">{ankiMessage}</p>}
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
