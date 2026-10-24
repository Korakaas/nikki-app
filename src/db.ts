import {
  DEFAULT_SETTINGS,
  type AnkiLibrary,
  type Entry,
  type Settings,
  type WeeklyReview,
} from './types'
import type { QuizHistory } from './quiz'

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
  return run<Entry | undefined>(ENTRIES, 'readonly', (s) => s.get(id))
}

export async function saveEntry(entry: Entry): Promise<void> {
  await run(ENTRIES, 'readwrite', (s) => s.put(entry))
}

export async function listEntries(): Promise<Entry[]> {
  const all = await run<Entry[]>(ENTRIES, 'readonly', (s) => s.getAll())
  return all.sort((a, b) => b.id.localeCompare(a.id))
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

export async function addReview(review: WeeklyReview): Promise<WeeklyReview[]> {
  const list = [review, ...(await loadReviews())].slice(0, MAX_REVIEWS)
  await run(SETTINGS, 'readwrite', (s) => s.put({ key: REVIEWS_KEY, list }))
  return list
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
}
