import {
  DEFAULT_SETTINGS,
  type AnkiLibrary,
  type Entry,
  type Settings,
  type WeeklyReview,
} from './types'
import type { QuizHistory } from './quiz'
import type { AchievementStore } from './achievements'
import { normalizeConj, type ConjState } from './conj/srs'
import { cleanEntry } from './trivial'
import { costOf } from './usage'
import { bestStamp, earnedStamp } from './stamps'

const DB_NAME = 'nikki'
const DB_VERSION = 1
const ENTRIES = 'entries'
const SETTINGS = 'settings'
const SETTINGS_KEY = 'app'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(ENTRIES)) {
          db.createObjectStore(ENTRIES, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(SETTINGS)) {
          db.createObjectStore(SETTINGS, { keyPath: 'key' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = fn(tx.objectStore(store))
        tx.oncomplete = () => resolve(req.result)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      }),
  )
}

/** Date locale (pas UTC) au format YYYY-MM-DD. */
export function todayId(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function getEntry(id: string): Promise<Entry | undefined> {
  const entry = await run<Entry | undefined>(ENTRIES, 'readonly', (s) => s.get(id))
  return entry && cleanEntry(entry)
}

/** Signale que des données utiles aux succès ont changé (regroupé : un seul signal après une rafale de sauvegardes). */
export const DATA_EVENT = 'nikki-data'
let notifyTimer: number | undefined
function notifyChange(): void {
  if (typeof window === 'undefined') return
  window.clearTimeout(notifyTimer)
  notifyTimer = window.setTimeout(() => window.dispatchEvent(new Event(DATA_EVENT)), 1200)
}

export async function saveEntry(entry: Entry): Promise<void> {
  // Le tampon gagné ne baisse jamais, même si le texte ou la correction changent ensuite.
  const stamp = bestStamp(entry.stamp, earnedStamp(entry))
  const toSave = stamp ? { ...entry, stamp } : entry
  await run(ENTRIES, 'readwrite', (s) => s.put(toSave))
  notifyChange()
}

export async function listEntries(): Promise<Entry[]> {
  const all = await run<Entry[]>(ENTRIES, 'readonly', (s) => s.getAll())
  return all.map(cleanEntry).sort((a, b) => b.id.localeCompare(a.id))
}

export async function deleteEntry(id: string): Promise<void> {
  await run(ENTRIES, 'readwrite', (s) => s.delete(id))
}

export async function loadSettings(): Promise<Settings> {
  const row = await run<(Settings & { key: string }) | undefined>(
    SETTINGS,
    'readonly',
    (s) => s.get(SETTINGS_KEY),
  )
  return { ...DEFAULT_SETTINGS, ...(row ?? {}) }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) =>
    s.put({ key: SETTINGS_KEY, ...settings }),
  )
}

const ANKI_KEY = 'anki'

export async function loadAnki(): Promise<AnkiLibrary | null> {
  const row = await run<(AnkiLibrary & { key: string }) | undefined>(
    SETTINGS,
    'readonly',
    (s) => s.get(ANKI_KEY),
  )
  if (!row) return null
  const { key: _key, ...lib } = row
  return lib
}

export async function saveAnki(lib: AnkiLibrary): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: ANKI_KEY, ...lib }))
}

export async function clearAnki(): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) => s.delete(ANKI_KEY))
}

/** Demande au navigateur de ne pas effacer les données en cas de manque de place. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}

/** Dernière sauvegarde exportée, et rappel repoussé (rangés dans le magasin des réglages). */
export interface BackupInfo {
  lastAt?: number
  snoozedUntil?: number
}

const BACKUP_KEY = 'backup'

export async function loadBackupInfo(): Promise<BackupInfo> {
  const row = await run<(BackupInfo & { key: string }) | undefined>(
    SETTINGS,
    'readonly',
    (s) => s.get(BACKUP_KEY),
  )
  return { lastAt: row?.lastAt, snoozedUntil: row?.snoozedUntil }
}

export async function saveBackupInfo(info: BackupInfo): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: BACKUP_KEY, ...info }))
}

const REVIEWS_KEY = 'reviews'
const MAX_REVIEWS = 12

/** Bilans de la semaine, du plus récent au plus ancien. */
export async function loadReviews(): Promise<WeeklyReview[]> {
  const row = await run<{ key: string; list?: WeeklyReview[] } | undefined>(
    SETTINGS,
    'readonly',
    (s) => s.get(REVIEWS_KEY),
  )
  return row?.list ?? []
}

export async function saveReviews(reviews: WeeklyReview[]): Promise<WeeklyReview[]> {
  const list = reviews.slice(0, MAX_REVIEWS)
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: REVIEWS_KEY, list }))
  notifyChange()
  return list
}

export async function addReview(review: WeeklyReview): Promise<WeeklyReview[]> {
  return saveReviews([review, ...(await loadReviews())])
}

const QUIZ_KEY = 'quiz'

/** Résultats du mini-quiz d'erreurs : combien de fois chaque erreur a été réussie / ratée. */
export async function loadQuizHistory(): Promise<QuizHistory> {
  const row = await run<{ key: string; results?: QuizHistory } | undefined>(
    SETTINGS,
    'readonly',
    (s) => s.get(QUIZ_KEY),
  )
  return row?.results ?? {}
}

export async function saveQuizHistory(results: QuizHistory): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: QUIZ_KEY, results }))
  notifyChange()
}

const CONJ_KEY = 'conj'

/** Cartes d'entraînement à la conjugaison (révision espacée). */
export async function loadConj(): Promise<ConjState> {
  const row = await run<{ key: string; state?: ConjState } | undefined>(
    SETTINGS,
    'readonly',
    (s) => s.get(CONJ_KEY),
  )
  return normalizeConj(row?.state)
}

export async function saveConj(state: ConjState): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: CONJ_KEY, state }))
  notifyChange()
}

const USAGE_KEY = 'usage'

/** Consommation de l'API sur ce téléphone, par mois puis par type d'appel. */
export interface UsageCounter {
  calls: number
  input: number
  output: number
  /** Dollars, d'après le tarif du modèle au moment de l'appel (absent des anciens compteurs). */
  cost?: number
}
export type UsageLog = Record<string, Record<string, UsageCounter>>

export async function loadUsage(): Promise<UsageLog> {
  const row = await run<{ key: string; months?: UsageLog } | undefined>(
    SETTINGS,
    'readonly',
    (s) => s.get(USAGE_KEY),
  )
  return row?.months ?? {}
}

/** Ajoute un appel au compteur (mois courant). Ne doit jamais faire échouer l'appel. */
export async function addUsage(
  kind: string,
  input: number,
  output: number,
  model = '',
  at = new Date(),
): Promise<void> {
  const months = await loadUsage()
  const month = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}`
  const slot = (months[month] ??= {})
  const c = (slot[kind] ??= { calls: 0, input: 0, output: 0 })
  c.calls++
  c.input += input
  c.output += output
  c.cost = (c.cost ?? 0) + costOf(input, output, model)
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: USAGE_KEY, months }))
}

const ACHIEVEMENTS_KEY = 'achievements'

/** Succès débloqués. Gardé hors sauvegarde : après une restauration, ils se recalculent d'après les données. */
export async function loadAchievementStore(): Promise<AchievementStore> {
  const row = await run<({ key: string } & Partial<AchievementStore>) | undefined>(
    SETTINGS,
    'readonly',
    (s) => s.get(ACHIEVEMENTS_KEY),
  )
  return { unlocked: row?.unlocked ?? {}, seeded: row?.seeded === true }
}

export async function saveAchievementStore(store: AchievementStore): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: ACHIEVEMENTS_KEY, ...store }))
}

const REVIEW_EXPORT_KEY = 'reviewExport'

/** Dernier jour copié « pour Claude » dans un bilan (AAAA-MM-JJ), ou null. Gardé hors sauvegarde. */
export async function loadReviewExportDay(): Promise<string | null> {
  const row = await run<{ key: string; day?: string } | undefined>(SETTINGS, 'readonly', (s) => s.get(REVIEW_EXPORT_KEY))
  return typeof row?.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.day) ? row.day : null
}

export async function saveReviewExportDay(day: string): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: REVIEW_EXPORT_KEY, day }))
}

const TWO_MIN_KEY = 'twoMinutes'

/** Dernier jour où une série « J'ai 2 minutes » a été terminée (hors sauvegarde). */
export async function loadTwoMinutesDay(): Promise<string | null> {
  const row = await run<{ day?: unknown } | undefined>(SETTINGS, 'readonly', (s) => s.get(TWO_MIN_KEY))
  return typeof row?.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.day) ? row.day : null
}

export async function saveTwoMinutesDay(day: string): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: TWO_MIN_KEY, day }))
}

const SPIKE_HANDLE_KEY = 'spike-backup-handle'

/** Essai S16.1 : garde le fichier d'essai choisi (jamais dans la sauvegarde). */
export async function saveSpikeHandle(handle: unknown): Promise<void> {
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: SPIKE_HANDLE_KEY, handle }))
}

export async function loadSpikeHandle(): Promise<unknown | null> {
  const row = await run<{ key: string; handle?: unknown } | undefined>(SETTINGS, 'readonly', (s) => s.get(SPIKE_HANDLE_KEY))
  return row?.handle ?? null
}
