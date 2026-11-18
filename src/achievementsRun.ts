import {
  listEntries,
  loadAchievementStore,
  loadConj,
  loadQuizHistory,
  loadReviews,
  saveAchievementStore,
  todayId,
} from './db'
import { syncAchievements, type SyncResult } from './achievements'

/**
 * Recalcule les succès d'après les données, garde les nouveaux déblocages, et renvoie ceux à célébrer.
 * À la toute première fois, les succès déjà mérités sont attribués sans célébration.
 */
export async function runAchievementSync(): Promise<SyncResult> {
  const [entries, reviews, quiz, conj, stored] = await Promise.all([
    listEntries(),
    loadReviews().catch(() => []),
    loadQuizHistory().catch(() => ({})),
    loadConj(),
    loadAchievementStore(),
  ])
  const result = syncAchievements({ entries, reviews, quiz, conj }, stored, todayId())
  const changed =
    !stored.seeded || Object.keys(result.store.unlocked).length !== Object.keys(stored.unlocked).length
  if (changed) await saveAchievementStore(result.store)
  return result
}
