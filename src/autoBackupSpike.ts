import { loadSpikeHandle, saveSpikeHandle } from './db'

/*
  Spike S16.1 : une sauvegarde automatique est-elle possible dans l'appli installée sur Android ?
  Cet essai n'écrit qu'un petit fichier texte « nikki-essai » : il ne touche jamais aux entrées.
*/

interface WritableHandle {
  name: string
  queryPermission?: (d: { mode: 'readwrite' }) => Promise<PermissionState>
  requestPermission?: (d: { mode: 'readwrite' }) => Promise<PermissionState>
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>
}

export interface Capabilities {
  savePicker: boolean
  dirPicker: boolean
  periodicSync: boolean
  persistApi: boolean
  /** Le stockage de l'appli est-il protégé contre le nettoyage automatique ? null = inconnu. */
  persisted: boolean | null
  installed: boolean
}

export async function capabilities(): Promise<Capabilities> {
  const w = window as unknown as Record<string, unknown>
  let persisted: boolean | null = null
  try {
    persisted = (await navigator.storage?.persisted?.()) ?? null
  } catch {
    persisted = null
  }
  return {
    savePicker: typeof w.showSaveFilePicker === 'function',
    dirPicker: typeof w.showDirectoryPicker === 'function',
    periodicSync: 'periodicSync' in ServiceWorkerRegistration.prototype,
    persistApi: typeof navigator.storage?.persist === 'function',
    persisted,
    installed: window.matchMedia('(display-mode: standalone)').matches,
  }
}

const stamp = () => new Date().toLocaleString('fr-FR')

/** Étape 1 : choisir un fichier d'essai et y écrire. Demande un tap, comme toute sauvegarde manuelle. */
export async function pickTestFile(): Promise<string> {
  const pick = (window as unknown as { showSaveFilePicker?: (o: unknown) => Promise<WritableHandle> }).showSaveFilePicker
  if (!pick) return "Ce navigateur ne sait pas choisir un fichier où écrire."
  try {
    const handle = await pick({ suggestedName: 'nikki-essai.txt' })
    const out = await handle.createWritable()
    await out.write(`Essai de sauvegarde 日記 : ${stamp()}`)
    await out.close()
    await saveSpikeHandle(handle)
    return `Écrit dans « ${handle.name} » à ${stamp()}. Ferme l'appli, rouvre-la, puis fais l'étape 2.`
  } catch (e) {
    return (e as Error)?.name === 'AbortError' ? 'Annulé.' : `Impossible : ${(e as Error)?.message ?? 'erreur inconnue'}`
  }
}

/** Étape 2 : réécrire dans le même fichier, sans le rechoisir. Dit si l'autorisation a été gardée. */
export async function rewriteTestFile(): Promise<string> {
  const handle = (await loadSpikeHandle().catch(() => null)) as WritableHandle | null
  if (!handle?.createWritable) return "Pas de fichier d'essai : fais d'abord l'étape 1."
  try {
    const state = (await handle.queryPermission?.({ mode: 'readwrite' })) ?? 'unknown'
    if (state !== 'granted') {
      const asked = (await handle.requestPermission?.({ mode: 'readwrite' })) ?? 'unknown'
      if (asked !== 'granted') return `Autorisation perdue (${state}), refusée ou impossible à redemander (${asked}).`
      const out = await handle.createWritable()
      await out.write(`Réécrit après une nouvelle autorisation : ${stamp()}`)
      await out.close()
      return `Il a fallu redonner l'autorisation (état ${state}), puis l'écriture a marché à ${stamp()}. Donc : pas d'écriture silencieuse.`
    }
    const out = await handle.createWritable()
    await out.write(`Réécrit sans rien demander : ${stamp()}`)
    await out.close()
    return `Réécrit sans aucune demande à ${stamp()} : l'autorisation est gardée.`
  } catch (e) {
    return `Impossible : ${(e as Error)?.message ?? 'erreur inconnue'}`
  }
}
