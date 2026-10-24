import { CorrectionFailure, requestCorrection } from './api'
import { getEntry, listEntries, saveEntry } from './db'
import type { Settings } from './types'

/** Émis quand une entrée change en arrière-plan (correction reçue ou échouée). */
export const ENTRY_UPDATED = 'nikki:entry-updated'

const running = new Set<string>()

function notify(id: string) {
  window.dispatchEvent(new CustomEvent(ENTRY_UPDATED, { detail: id }))
}

/**
 * Corrige l'entrée `id` et enregistre le résultat (ou l'échec) dans l'entrée.
 * Ne lève jamais d'exception : l'issue se lit dans l'entrée.
 */
export async function runCorrection(id: string, settings: Settings): Promise<void> {
  if (running.has(id)) return
  running.add(id)
  try {
    const entry = await getEntry(id)
    if (!entry || !entry.text.trim()) return

    let patch: Partial<typeof entry>
    try {
      const correction = await requestCorrection(entry.text, settings, entry.prompt)
      patch = { correction, pendingCorrection: false, correctionError: undefined }
    } catch (e) {
      const message =
        e instanceof CorrectionFailure ? e.message : 'La correction a échoué. Réessaie.'
      patch = { pendingCorrection: false, correctionError: message }
    }

    // On relit l'entrée : le texte a pu être modifié pendant l'appel.
    const latest = (await getEntry(id)) ?? entry
    const next = { ...latest, ...patch }
    if (next.correctionError === undefined) delete next.correctionError
    await saveEntry(next)
  } finally {
    running.delete(id)
    notify(id)
  }
}

export function isRunning(id: string): boolean {
  return running.has(id)
}

/** Envoie les corrections demandées hors-ligne, si le réseau et la clé sont là. */
export async function processPending(settings: Settings): Promise<void> {
  if (!settings.apiKey || !navigator.onLine) return
  const pending = (await listEntries()).filter((e) => e.pendingCorrection)
  for (const entry of pending) {
    await runCorrection(entry.id, settings)
  }
}
