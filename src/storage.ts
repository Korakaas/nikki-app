/**
 * S16.4 : demande à Chrome de protéger les données de l'appli (entrées, photos, réglages) du nettoyage
 * automatique quand le téléphone manque de place. Chrome répond seul, sans fenêtre ni notification,
 * en général oui pour une appli installée et utilisée. Ne remplace pas la sauvegarde hebdomadaire :
 * vider les données de l'appli ou la désinstaller efface toujours tout.
 * Rend true (protégé), false (refusé pour l'instant) ou null (non pris en charge).
 */
export async function protectStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist || !navigator.storage?.persisted) return null
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return null
  }
}
