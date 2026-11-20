import { useEffect, useMemo, useState } from 'react'
import { loadReviewExportDay, saveReviewExportDay } from '../db'
import { addDays } from '../format'
import { periodForClaude, periodWindow } from '../review'
import type { AnkiLibrary, Entry, Settings } from '../types'

interface Props {
  entries: Entry[]
  library: AnkiLibrary | null
  settings: Settings
  today: string
  /** Points déjà visés par les bilans précédents (pour ne pas les reproposer). */
  alreadyTargeted: string[]
}

/** Au-delà, le texte devient pénible à coller dans une conversation : on prévient. */
const LONG_TEXT = 30000

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function shortDay(id: string): string {
  const [, m, d] = id.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''}`
}

function range(from: string, to: string): string {
  return from === to ? `Le ${shortDay(from)}` : `Du ${shortDay(from)} au ${shortDay(to)}`
}

function plural(n: number): string {
  return `${n} entrée${n > 1 ? 's' : ''}`
}

async function toClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Pas d'accès au presse-papiers : on passe par une zone de texte sélectionnée.
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    if (!ok) throw new Error('copy')
  }
}

/**
 * Copie les entrées d'une période pour les coller dans une conversation avec Claude (pas d'appel à l'API).
 * Par défaut : depuis le lendemain du dernier jour déjà copié, sinon les 7 derniers jours.
 */
export default function CopyForClaude({ entries, library, settings, today, alreadyTargeted }: Props) {
  const [lastDay, setLastDay] = useState<string | null | undefined>(undefined)
  const [custom, setCustom] = useState(false)
  const [from, setFrom] = useState(addDays(today, -6))
  const [to, setTo] = useState(today)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void loadReviewExportDay()
      .then(setLastDay)
      .catch(() => setLastDay(null))
  }, [])

  // Période par défaut : après le dernier jour copié (jamais avant les 31 derniers jours pour rester raisonnable).
  const defaultFrom = lastDay ? addDays(lastDay, 1) : addDays(today, -6)
  const start = custom ? from : defaultFrom
  const end = custom ? to : today
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) && start <= end

  const count = useMemo(() => (valid ? periodWindow(entries, start, end).entries.length : 0), [entries, start, end, valid])
  const size = useMemo(() => {
    if (!valid || count === 0) return 0
    try {
      return periodForClaude(entries, library, settings, today, start, end, alreadyTargeted).length
    } catch {
      return 0
    }
  }, [entries, library, settings, today, start, end, valid, count, alreadyTargeted])

  async function copy() {
    setError('')
    setCopied('')
    try {
      await toClipboard(periodForClaude(entries, library, settings, today, start, end, alreadyTargeted))
      // Le dernier jour copié n'avance jamais en arrière : recopier une vieille période ne perd rien.
      const mark = lastDay && lastDay > end ? lastDay : end
      await saveReviewExportDay(mark)
      setLastDay(mark)
      setCopied(`${range(start, end)} · ${plural(count)}`)
      setCustom(false)
    } catch {
      setError('Impossible de copier. Réessaie.')
    }
  }

  if (lastDay === undefined) return null

  const nothingNew = !custom && lastDay !== null && addDays(lastDay, 1) > today

  return (
    <div className="copy-claude" lang="fr">
      {!custom ? (
        <>
          <p className="copy-title">
            {lastDay ? `Depuis le dernier bilan copié (${shortDay(lastDay)})` : 'Pas encore de bilan copié'}
          </p>
          <p className="muted copy-line">
            {nothingNew
              ? 'Rien de nouveau depuis ta dernière copie.'
              : lastDay
                ? `${range(start, end)} · ${plural(count)}`
                : `Je prends les 7 derniers jours : ${range(start, end).toLowerCase()} · ${plural(count)}`}
          </p>
        </>
      ) : (
        <>
          <p className="copy-title">Choisir les dates</p>
          <div className="copy-dates">
            <input type="date" aria-label="Du" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            <span aria-hidden="true">→</span>
            <input type="date" aria-label="Au" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
          </div>
          <p className="muted copy-line">
            {valid ? `${plural(count)}${size ? ` · ≈ ${size.toLocaleString('fr-FR')} caractères` : ''}` : 'Choisis un début avant la fin.'}
          </p>
        </>
      )}
      {size > LONG_TEXT && (
        <p className="problem copy-long" role="status">
          Texte long (≈ {size.toLocaleString('fr-FR')} caractères) : il sera difficile à coller. Réduis la période si tu peux.
        </p>
      )}
      <div className="row copy-actions">
        <button type="button" className="sketch primary" disabled={!valid || count === 0} onClick={() => void copy()}>
          Copier pour Claude
        </button>
        <button type="button" className="link" onClick={() => setCustom((v) => !v)}>
          {custom ? (lastDay ? 'Depuis le dernier bilan' : '7 derniers jours') : 'Choisir les dates'}
        </button>
      </div>
      {copied && (
        <p className="fr green-ink" role="status">
          Copié ({copied}) ! Colle-le dans une conversation avec Claude pour avoir ton bilan sans passer par l'API.
        </p>
      )}
      {error && (
        <p className="problem" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
