import { ENTRY_UPDATED } from './corrector'
import { getEntry, saveEntry } from './db'
import type { Correction, ThreadTurn } from './types'

/**
 * Range le fil sous sa correction (celle qui porte ce `createdAt`) et prévient les écrans.
 * Si la correction a été refaite entre-temps, le fil de l'ancienne n'est pas collé à la nouvelle.
 */
export async function saveThread(id: string, correctionCreatedAt: number, thread: ThreadTurn[]): Promise<boolean> {
  const entry = await getEntry(id)
  if (!entry?.correction || entry.correction.createdAt !== correctionCreatedAt) return false
  const correction: Correction = { ...entry.correction, thread }
  if (thread.length === 0) delete correction.thread
  await saveEntry({ ...entry, correction, updatedAt: Date.now() })
  window.dispatchEvent(new CustomEvent(ENTRY_UPDATED, { detail: id }))
  return true
}
