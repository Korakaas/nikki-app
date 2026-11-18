import type { Entry } from './types'

function dayNumber(id: string): number {
  const [y, m, d] = id.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

export interface Memory {
  entry: Entry
  daysAgo: number
}

/**
 * Une ancienne entrée à relire : la plus proche d'il y a un mois, mais au moins une semaine en arrière.
 * `null` tant que rien n'a une semaine.
 */
export function pickMemory(entries: Entry[], todayId: string): Memory | null {
  const today = dayNumber(todayId)
  let best: Memory | null = null
  for (const entry of entries) {
    if (entry.text.trim() === '' || entry.id >= todayId) continue
    const daysAgo = today - dayNumber(entry.id)
    if (daysAgo < 7) continue
    if (!best || Math.abs(daysAgo - 30) < Math.abs(best.daysAgo - 30)) best = { entry, daysAgo }
  }
  return best
}
