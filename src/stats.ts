import { addDays, countChars } from './format'
import { plainText } from './furigana'
import { patternKey } from './anki'
import type { Entry, ErrorKind } from './types'

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

// ------------------------------------------------ statistiques

export interface WritingTotals {
  days: number
  chars: number
  average: number
  corrected: number
}

export function writingTotals(entries: Entry[]): WritingTotals {
  const written = entries.filter((e) => e.text.trim() !== '')
  const chars = written.reduce((sum, e) => sum + countChars(e.text), 0)
  return {
    days: written.length,
    chars,
    average: written.length ? Math.round(chars / written.length) : 0,
    corrected: written.filter((e) => e.correction).length,
  }
}

export interface MonthStat {
  key: string
  month: number
  chars: number
  days: number
}

/** Les `count` derniers mois (le mois en cours inclus), même vides. */
export function monthStats(entries: Entry[], today: string, count = 6): MonthStat[] {
  const [y, m] = today.split('-').map(Number)
  const months: MonthStat[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ key, month: d.getMonth() + 1, chars: 0, days: 0 })
  }
  for (const e of entries) {
    if (e.text.trim() === '') continue
    const month = months.find((x) => x.key === e.id.slice(0, 7))
    if (!month) continue
    month.chars += countChars(e.text)
    month.days++
  }
  return months
}

export function errorKinds(entries: Entry[]): { kind: ErrorKind; count: number }[] {
  const counts = new Map<ErrorKind, number>()
  for (const e of entries) {
    for (const item of e.correction?.errors ?? []) {
      counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1)
    }
  }
  return [...counts]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count)
}

export interface TrendPoint {
  id: string
  errors: number
  chars: number
  /** Fautes relevées pour 100 caractères écrits. */
  per100: number
}

/** Les `count` dernières entrées corrigées, de la plus ancienne à la plus récente. */
export function errorTrend(entries: Entry[], count = 12): TrendPoint[] {
  return entries
    .filter((e) => e.correction && countChars(e.correction.sourceText) >= 10)
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(-count)
    .map((e) => {
      const chars = countChars(e.correction!.sourceText)
      const errors = e.correction!.errors.length
      return { id: e.id, errors, chars, per100: (errors / chars) * 100 }
    })
}

export interface PointCount {
  point: string
  count: number
}

function tally(points: string[]): PointCount[] {
  const groups = new Map<string, PointCount>()
  for (const raw of points) {
    const point = plainText(raw).trim()
    const key = patternKey(point)
    if (!key) continue
    const group = groups.get(key)
    if (group) group.count++
    else groups.set(key, { point, count: 1 })
  }
  return [...groups.values()].sort((a, b) => b.count - a.count)
}

/** Points de grammaire les plus souvent bien employés / à revoir. */
export function topPoints(entries: Entry[]): { good: PointCount[]; review: PointCount[] } {
  return {
    good: tally(entries.flatMap((e) => e.correction?.grammarGood.map((g) => g.point) ?? [])),
    review: tally(entries.flatMap((e) => e.correction?.grammarReview.map((g) => g.point) ?? [])),
  }
}
