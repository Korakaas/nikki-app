import { addDays } from './format'
import { plainText } from './furigana'
import { patternKey } from './anki'
import type { Entry } from './types'

/** Jours où quelque chose a été écrit. */
export function writtenDays(entries: Entry[]): Set<string> {
  return new Set(entries.filter((e) => e.text.trim() !== '').map((e) => e.id))
}

export interface StreakInfo {
  /** Jours d'affilée jusqu'à aujourd'hui (ou hier, tant que la journée n'est pas finie). */
  current: number
  best: number
  total: number
}

export function streakInfo(days: Set<string>, today: string): StreakInfo {
  let current = 0
  let cursor = days.has(today) ? today : addDays(today, -1)
  while (days.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }

  let best = 0
  let run = 0
  let previous = ''
  for (const day of [...days].sort()) {
    run = previous && addDays(previous, 1) === day ? run + 1 : 1
    best = Math.max(best, run)
    previous = day
  }
  return { current, best, total: days.size }
}

// ------------------------------------------------ grammaire bien employée

/** Variantes d'un point (« 〜ば／〜なら…ほど » → plusieurs clés de comparaison). */
function variants(pattern: string): string[] {
  const keys = pattern
    .split(/[／・/]/)
    .map(patternKey)
    .filter((k) => k.length > 0)
  const whole = patternKey(pattern)
  return whole && !keys.includes(whole) ? [whole, ...keys] : keys
}

function same(a: string, b: string): boolean {
  if (a === b) return true
  // Une inclusion ne compte que pour des clés assez longues (sinon « に » irait partout).
  return Math.min(a.length, b.length) >= 3 && (a.includes(b) || b.includes(a))
}

/** Points de grammaire jugés « bien employés » dans les corrections, un élément par mention. */
export function goodPoints(entries: Entry[]): string[][] {
  return entries.flatMap(
    (e) => e.correction?.grammarGood.map((g) => variants(plainText(g.point))) ?? [],
  )
}

/** Combien de fois ce point a été bien employé, d'après les corrections. */
export function timesUsed(pattern: string, good: string[][]): number {
  const mine = variants(pattern)
  return good.filter((g) => g.some((k) => mine.some((m) => same(m, k)))).length
}
