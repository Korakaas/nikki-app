import { useEffect, useRef, useState } from 'react'
import { emptyLibrary, mergeExport, parseAnkiExport } from '../anki'
import { backupStatus, canShareFile, exportBackup, importBackup } from '../backup'
import { clearAnki, listEntries, loadAnki, loadUsage, saveAnki, type UsageLog } from '../db'
import Block from '../components/Block'
import CapNotice from '../components/CapNotice'
import { CAP_ALERT_SHARE, CORRECTIONS_PER_MONTH, capShare, correctionCosts, formatCost, KIND_LABEL, monthId, monthUsage, previousMonthId } from '../usage'
import { paletteOf, THREAD_LIMIT_MAX, THREAD_LIMIT_MIN, threadLimitOf, type AnkiLibrary, type FuriganaFrom, type Palette, type Settings, type Theme } from '../types'

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

const PALETTE_OPTIONS: { value: Palette; label: string }[] = [
  { value: 'matcha', label: 'Matcha et sakura' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'canard', label: 'Canard' },
]

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Automatique (comme le téléphone)' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
]

export default function SettingsPage({ settings, onChange }: Props) {
  const [showKey, setShowKey] = useState(false)
  // Le bloc Claude est replié ; il s'ouvre tout seul tant qu'il n'y a pas de clé API (S18.12).
  const [claudeOpen, setClaudeOpen] = useState(!settings.apiKey)
  const claudeSummary = `${settings.apiKey ? 'Clé enregistrée' : 'Pas de clé API'} · correction ${settings.correctionMode === 'short' ? 'courte' : 'complète'}`
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
  const [lastBackup, setLastBackup] = useState('')
  const [usage, setUsage] = useState<UsageLog>({})
  useEffect(() => {
    void loadUsage()
      .then(setUsage)
      .catch(() => setUsage({}))
  }, [])
  const refreshStatus = async () => {
    const s = await backupStatus()
    setLastBackup(
      s.days === null
        ? ''
        : s.never
          ? 'Jamais sauvegardé.'
          : s.days === 0
            ? "Dernière sauvegarde : aujourd'hui."
            : `Dernière sauvegarde : il y a ${s.days} jour(s).`,
    )
  }

  useEffect(() => {
    void refreshStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  async function doExport(share: boolean) {
    const count = (await listEntries()).filter((e) => e.text.trim() !== '').length
    const result = await exportBackup(settings, share)
    if (result === 'cancelled') setMessage('Partage annulé.')
    else if (result === 'shared') setMessage(`${count} entrée(s) sauvegardée(s).`)
    else setMessage(`${count} entrée(s) exportée(s) dans un fichier (dossier Téléchargements).`)
    void refreshStatus()
  }

  async function doImport(file: File) {
    try {
      const hadAnki = (await loadAnki().catch(() => null)) !== null
      const result = await importBackup(await file.text(), !hadAnki)
      const parts = [`${result.imported} entrée(s) importée(s).`]
      if (result.anki) {
        setLibrary(await loadAnki())
        parts.push('Cartes Anki restaurées.')
      }
      // Téléphone neuf (pas encore de clé API) : on reprend aussi les réglages de la sauvegarde.
      if (result.settings && !settings.apiKey) {
        onChange({ ...settings, ...result.settings, apiKey: '' })
        parts.push('Réglages restaurés (remets ta clé API).')
      }
      setMessage(parts.join(' '))
    } catch {
      setMessage('Fichier de sauvegarde invalide.')
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Réglages</h1>
      </header>

      <Block role="set" ja="書" title="Écriture">
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
            <option value="N2">N2</option>
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
          <span className="label" id="palette-label">Couleurs</span>
          <div role="radiogroup" aria-labelledby="palette-label" className="palette-choice">
            {PALETTE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={paletteOf(settings) === o.value}
                className={paletteOf(settings) === o.value ? 'palette-option on' : 'palette-option'}
                onClick={() => patch({ palette: o.value })}
              >
                <span className="palette-dots" data-demo={o.value} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="fr">{o.label}</span>
              </button>
            ))}
          </div>
          <p className="hint">Seule la petite pastille des titres change de couleur.</p>
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
      </Block>

      <Block role="set" ja="Anki" title="Cartes Anki">
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
      </Block>

      <Block
        role="set"
        ja="API"
        title="Claude"
        open={claudeOpen}
        onToggle={() => setClaudeOpen((v) => !v)}
        summary={claudeSummary}
      >
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
          <label htmlFor="light-model">Modèle léger</label>
          <input
            id="light-model"
            type="text"
            value={settings.lightModel}
            onChange={(e) => patch({ lightModel: e.target.value.trim() })}
            spellCheck={false}
          />
          <p className="hint">
            Pour les petites tâches (le défi de traduction du thème), à environ 20 fois moins cher que le
            modèle de correction. S'il ne répond pas, c'est le modèle principal qui prend le relais.
          </p>
        </div>
        <div className="field">
          <span className="label" id="mode-label">Correction</span>
          {(() => {
            const costs = correctionCosts(usage)
            const money = (v: number) => (v < 0.1 ? v.toFixed(3) : v.toFixed(2)).replace('.', ',')
            const month = (v: number) => v * CORRECTIONS_PER_MONTH
            const options: { value: Settings['correctionMode']; name: string; what: string; per: number; measured: boolean }[] = [
              {
                value: 'full',
                name: 'Complète',
                what: "Chaque faute avec ses explications, l'encouragement, la grammaire bien placée.",
                per: costs.full,
                measured: costs.fullMeasured,
              },
              {
                value: 'short',
                name: 'Courte',
                what: "La faute, la correction et une phrase d'explication. L'encouragement reste.",
                per: costs.short,
                measured: costs.shortMeasured,
              },
            ]
            return (
              <div role="radiogroup" aria-labelledby="mode-label" className="mode-choice">
                {options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={settings.correctionMode === o.value}
                    className={settings.correctionMode === o.value ? 'mode-option selected' : 'mode-option'}
                    onClick={() => patch({ correctionMode: o.value })}
                  >
                    <span className="mode-name">{o.name}</span>
                    <span className="mode-what fr">{o.what}</span>
                    <span className="mode-cost fr">
                      ≈ {money(o.per)} $ par correction · ≈ {money(month(o.per))} $ par mois
                      {o.measured ? '' : ' (estimation)'}
                    </span>
                  </button>
                ))}
                <p className="hint">
                  S'applique à la prochaine correction ; les anciennes gardent leur forme. Estimé pour une correction
                  par jour pendant 30 jours.
                </p>
              </div>
            )
          })()}
        </div>
        <div className="field">
          <span className="label">Consommation de l'API</span>
          {(() => {
            const now = monthUsage(usage, monthId())
            const last = monthUsage(usage, previousMonthId())
            const tokens = (n: number) => n.toLocaleString('fr-FR')
            const share = capShare(now.cost, settings.monthlyCap)
            const capField = <CapField value={settings.monthlyCap} onCommit={(v) => patch({ monthlyCap: v })} />
            if (now.calls === 0 && last.calls === 0)
              return (
                <>
                  <p className="hint">Rien de compté pour l'instant : chaque appel (correction, bilan, phrase d'exemple) s'ajoutera ici.</p>
                  {capField}
                </>
              )
            return (
              <>
                <p className="usage-line">
                  Ce mois-ci : <strong>≈ {formatCost(now.cost)}</strong> sur {formatCost(settings.monthlyCap)} · {now.calls} appel{now.calls > 1 ? 's' : ''}
                </p>
                <div
                  className={`cap-bar${share >= CAP_ALERT_SHARE ? ' near' : ''}`}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.round(share * 100))}
                  aria-label="Part du plafond du mois"
                >
                  <i style={{ width: `${Math.min(100, share * 100)}%` }} />
                </div>
                <CapNotice settings={settings} />
                <p className="hint">
                  {now.byKind.map(([k, c]) => `${c.calls} ${KIND_LABEL[k] ?? k}`).join(', ')} ·{' '}
                  {tokens(now.input)} jetons envoyés, {tokens(now.output)} reçus.
                </p>
                {last.calls > 0 && (
                  <p className="hint">
                    Mois dernier : ≈ {formatCost(last.cost)} ({last.calls} appels).
                  </p>
                )}
                {capField}
                <p className="hint">
                  Estimation d'après les tarifs publiés (Sonnet 5.5 : 2 $ / 10 $ par million de jetons ; Haiku 5.5 : 0,10 $ /
                  0,50 $) ; elle ne compte que les appels faits depuis ce téléphone. Le chiffre exact est sur
                  console.anthropic.com.
                </p>
              </>
            )
          })()}
        </div>
        <div className="field">
          <span className="label" id="thread-limit-label">Échanges par correction</span>
          <p className="hint">
            Combien de questions tu peux poser sur chaque correction (de {THREAD_LIMIT_MIN} à {THREAD_LIMIT_MAX}). Chaque échange
            coûte environ 0,0004 $ avec le modèle léger.
          </p>
          <div className="stepper" role="group" aria-labelledby="thread-limit-label">
            <button
              type="button"
              className="sketch"
              aria-label="Un échange de moins"
              disabled={threadLimitOf(settings) <= THREAD_LIMIT_MIN}
              onClick={() => patch({ threadLimit: threadLimitOf(settings) - 1 })}
            >
              −
            </button>
            <output className="stepper-value" aria-live="polite">{threadLimitOf(settings)}</output>
            <button
              type="button"
              className="sketch"
              aria-label="Un échange de plus"
              disabled={threadLimitOf(settings) >= THREAD_LIMIT_MAX}
              onClick={() => patch({ threadLimit: threadLimitOf(settings) + 1 })}
            >
              +
            </button>
          </div>
        </div>
      </Block>

      <Block role="set" ja="保存" title="Sauvegarde">
        <div className="field">
          <span className="label">Sauvegarde</span>
          <div className="row">
            {canShareFile() && (
              <button type="button" className="primary" onClick={() => void doExport(true)}>
                Sauvegarder…
              </button>
            )}
            <button type="button" onClick={() => void doExport(false)}>
              Télécharger
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
                if (file) void doImport(file)
                e.target.value = ''
              }}
            />
          </div>
          <p className="hint">
            Tes entrées ne vivent que sur ce téléphone. « Sauvegarder… » ouvre le
            menu de partage : choisis Drive (ou ton e-mail) et c'est en sécurité.
            Le fichier contient tes entrées, photos, bilans, résultats du quiz, cartes Anki et réglages, pas ta
            clé API. L'appli te le rappelle chaque semaine.
          </p>
          {lastBackup && <p className="hint">{lastBackup}</p>}
          {message && <p className="notice">{message}</p>}
        </div>
      </Block>
    </section>
  )
}

/** Plafond mensuel en dollars : on tape librement, la valeur est enregistrée en quittant le champ. */
function CapField({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [text, setText] = useState(String(value).replace('.', ','))
  const commit = () => {
    const v = Number(text.replace(',', '.'))
    if (Number.isFinite(v) && v > 0) onCommit(Math.round(v * 100) / 100)
    else setText(String(value).replace('.', ','))
  }
  return (
    <div className="cap-field">
      <label htmlFor="monthly-cap">Plafond du mois</label>
      <input
        id="monthly-cap"
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      <span>$</span>
    </div>
  )
}
