import {
  listEntries,
  loadAnki,
  loadBackupInfo,
  saveAnki,
  saveBackupInfo,
  saveEntry,
  todayId,
} from './db'
import type { AnkiLibrary, Entry, Settings } from './types'

export const BACKUP_EVENT = 'nikki-backup'
const DAY = 86_400_000
/** Au bout de combien de jours sans sauvegarde on le rappelle. */
export const REMINDER_DAYS = 7

export interface BackupFile {
  version: 2
  exportedAt: number
  entries: Entry[]
  /** Cartes Anki importées. */
  anki?: AnkiLibrary | null
  /** Réglages, sans la clé API (elle ne quitte jamais le téléphone). */
  settings?: Omit<Settings, 'apiKey'>
}

export async function buildBackup(settings: Settings): Promise<BackupFile> {
  const { apiKey: _apiKey, ...rest } = settings
  return {
    version: 2,
    exportedAt: Date.now(),
    entries: await listEntries(),
    anki: await loadAnki().catch(() => null),
    settings: rest,
  }
}

function backupName(): string {
  return `nikki-sauvegarde-${todayId()}.json`
}

async function markDone(): Promise<void> {
  const info = await loadBackupInfo()
  await saveBackupInfo({ ...info, lastAt: Date.now(), snoozedUntil: undefined })
  window.dispatchEvent(new Event(BACKUP_EVENT))
}

export type ExportResult = 'shared' | 'downloaded' | 'cancelled'

/** Le téléphone sait-il ouvrir sa feuille de partage avec un fichier ? */
export function canShareFile(): boolean {
  try {
    const probe = new File(['{}'], 'x.json', { type: 'application/json' })
    return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [probe] })
  } catch {
    return false
  }
}

/**
 * Exporte le journal. `share` ouvre la feuille de partage d'Android (Drive, Gmail, Fichiers…) :
 * un geste suffit pour mettre la sauvegarde hors du téléphone. Sinon on télécharge le fichier.
 */
export async function exportBackup(settings: Settings, share: boolean): Promise<ExportResult> {
  const backup = await buildBackup(settings)
  const json = JSON.stringify(backup)
  const type = 'application/json'
  if (share && canShareFile()) {
    const file = new File([json], backupName(), { type })
    try {
      await navigator.share({ files: [file], title: 'Sauvegarde du journal' })
      await markDone()
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
      // Partage impossible : on retombe sur le téléchargement.
    }
  }
  const url = URL.createObjectURL(new Blob([json], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = backupName()
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  await markDone()
  return 'downloaded'
}

export interface ImportResult {
  imported: number
  anki: boolean
  settings?: Omit<Settings, 'apiKey'>
}

/** Fusionne un fichier de sauvegarde : la version la plus récente de chaque jour l'emporte. */
export async function importBackup(text: string, restoreAnki: boolean): Promise<ImportResult> {
  const data = JSON.parse(text) as Partial<BackupFile>
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
  let anki = false
  if (restoreAnki && data.anki && Array.isArray(data.anki.decks)) {
    await saveAnki(data.anki)
    anki = true
  }
  return { imported, anki, settings: data.settings }
}

export interface BackupStatus {
  /** Nombre de jours depuis la dernière sauvegarde (ou depuis la première entrée). */
  days: number | null
  never: boolean
  due: boolean
}

/** Faut-il rappeler la sauvegarde ? Pas avant trois entrées écrites. */
export async function backupStatus(now = Date.now()): Promise<BackupStatus> {
  const written = (await listEntries()).filter((e) => e.text.trim() !== '')
  if (written.length === 0) return { days: null, never: true, due: false }
  const info = await loadBackupInfo()
  const baseline = info.lastAt ?? Math.min(...written.map((e) => e.createdAt))
  const days = Math.max(0, Math.floor((now - baseline) / DAY))
  const snoozed = info.snoozedUntil !== undefined && now < info.snoozedUntil
  return {
    days,
    never: info.lastAt === undefined,
    due: written.length >= 3 && days >= REMINDER_DAYS && !snoozed,
  }
}

export async function snoozeReminder(days = 3): Promise<void> {
  const info = await loadBackupInfo()
  await saveBackupInfo({ ...info, snoozedUntil: Date.now() + days * DAY })
  window.dispatchEvent(new Event(BACKUP_EVENT))
}
