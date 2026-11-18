import { addDays, countChars } from './format'
import { wordUsed } from './words'
import { plainText } from './furigana'
import { patternKey } from './anki'
import type { Entry, ErrorKind } from './types'

/** Jours où quelque chose a été écrit. */
export function writtenDays(entries: Entry[]): Set<string> {
  return new Set(entries.filter((e) => e.text.trim() !== '').map((e) => e.id))
}

export interface StreakInfo {
  /** Jours écrits dans la série en cours (le chiffre reste affiché pendant une pause). */
  current: number
  /** Record : jamais effacé. */
  best: number
  total: number
  /** Deux jours entiers d'affilée sans entrée : la série est en pause (elle repartira à 1). */
  paused: boolean
  /** Dernier jour écrit (vide s'il n'y en a aucun). */
  lastDay: string
}

/** Nombre de jours entiers de `a` à `b` (YYYY-MM-DD, jours civils, sans effet de l'heure d'été). */
function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000)
}

/**
 * Série douce. Un jour sans entrée ne casse rien : la série continue. Deux jours entiers
 * d'affilée sans entrée la mettent en pause : son chiffre reste affiché, et elle repart
 * à 1 à la prochaine entrée. Le record n'est jamais effacé. Seuls les jours écrits sont comptés.
 * Le jour en cours n'est pas encore « manqué » : on ne compte que les jours entiers écoulés.
 */
export function streakInfo(days: Set<string>, today: string): StreakInfo {
  let best = 0
  let run = 0
  let previous = ''
  for (const day of [...days].filter((d) => d <= today).sort()) {
    run = previous && daysBetween(previous, day) <= 2 ? run + 1 : 1
    best = Math.max(best, run)
    previous = day
  }
  const missed = previous ? Math.max(0, daysBetween(previous, today) - 1) : 0
  return { current: run, best, total: days.size, paused: missed >= 2, lastDay: previous }
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

// ------------------------------------------------ mots du jour

export interface WordRecord {
  ja: string
  reading: string
  fr: string
  /** Combien de fois il a été proposé sur une page où tu as écrit. */
  proposed: number
  /** Combien de fois tu l'as employé ensuite. */
  used: number
  /** Dernière page où il a été proposé. */
  lastId: string
}

/** Historique de chaque mot proposé, d'après les pages où quelque chose a été écrit. */
export function wordHistory(entries: Entry[]): Map<string, WordRecord> {
  const map = new Map<string, WordRecord>()
  for (const e of entries) {
    if (!e.prompt || e.text.trim() === '') continue
    for (const w of e.prompt.words) {
      const rec = map.get(w.ja) ?? {
        ja: w.ja,
        reading: w.reading,
        fr: w.fr,
        proposed: 0,
        used: 0,
        lastId: '',
      }
      rec.proposed++
      if (wordUsed(w, e.text)) rec.used++
      if (e.id > rec.lastId) rec.lastId = e.id
      map.set(w.ja, rec)
    }
  }
  return map
}

export interface WordTotals {
  proposed: number
  used: number
  /** Mots proposés qui n'ont jamais été employés, du plus récent au plus ancien. */
  unused: WordRecord[]
}

export function wordTotals(entries: Entry[]): WordTotals {
  let proposed = 0
  let used = 0
  for (const e of entries) {
    if (!e.prompt || e.text.trim() === '') continue
    for (const w of e.prompt.words) {
      proposed++
      if (wordUsed(w, e.text)) used++
    }
  }
  const unused = [...wordHistory(entries).values()]
    .filter((r) => r.used === 0)
    .sort((a, b) => b.lastId.localeCompare(a.lastId))
  return { proposed, used, unused }
}

/** Fautes relevées pour 100 caractères, sur toutes les entrées corrigées (null s'il n'y en a pas). */
export function overallPer100(entries: Entry[]): number | null {
  let errors = 0
  let chars = 0
  for (const e of entries) {
    if (e.text.trim() === '' || !e.correction) continue
    const n = countChars(e.correction.sourceText)
    if (n < 10) continue
    chars += n
    errors += e.correction.errors.length
  }
  return chars > 0 ? (errors / chars) * 100 : null
}

// ------------------------------------------------ par semaine

export interface WeekStat {
  /** Lundi de la semaine (YYYY-MM-DD). */
  monday: string
  days: number
  chars: number
  /** Caractères par entrée écrite. */
  average: number
  corrected: number
  errors: number
  /** Fautes pour 100 caractères, sur les entrées corrigées (null s'il n'y en a pas). */
  per100: number | null
}

function mondayOf(id: string): string {
  const [y, m, d] = id.split('-').map(Number)
  const day = new Date(y, m - 1, d).getDay()
  return addDays(id, -((day + 6) % 7))
}

/** Les `count` dernières semaines (lundi → dimanche), la semaine en cours comprise. */
export function weekStats(entries: Entry[], today: string, count = 8): WeekStat[] {
  const last = mondayOf(today)
  const weeks: WeekStat[] = []
  for (let i = count - 1; i >= 0; i--) {
    weeks.push({
      monday: addDays(last, -7 * i),
      days: 0,
      chars: 0,
      average: 0,
      corrected: 0,
      errors: 0,
      per100: null,
    })
  }
  const correctedChars = new Map<string, number>()
  for (const e of entries) {
    if (e.text.trim() === '') continue
    const week = weeks.find((w) => w.monday === mondayOf(e.id))
    if (!week) continue
    week.days++
    week.chars += countChars(e.text)
    if (e.correction && countChars(e.correction.sourceText) >= 10) {
      week.corrected++
      week.errors += e.correction.errors.length
      correctedChars.set(
        week.monday,
        (correctedChars.get(week.monday) ?? 0) + countChars(e.correction.sourceText),
      )
    }
  }
  for (const w of weeks) {
    w.average = w.days ? Math.round(w.chars / w.days) : 0
    const c = correctedChars.get(w.monday) ?? 0
    w.per100 = c > 0 ? (w.errors / c) * 100 : null
  }
  return weeks
}

// ------------------------------------------------ bilan du mois

export interface MonthReviewData {
  /** YYYY-MM */
  month: string
  days: number
  chars: number
  average: number
  corrected: number
  errors: number
  per100: number | null
  /** Le mois d'avant, pour comparer. */
  prev: { days: number; average: number; per100: number | null }
  kinds: { kind: ErrorKind; count: number; prev: number }[]
  /** Points de grammaire « bien employés » pour la première fois ce mois-ci. */
  newlyGood: string[]
  /** Points à revoir ce mois-ci, puis bien employés ensuite. */
  recovered: string[]
  /** Points à revoir ce mois-ci et jamais bien employés depuis. */
  stillReview: string[]
  words: { proposed: number; used: number }
}

function inMonth(entries: Entry[], month: string): Entry[] {
  return entries.filter((e) => e.id.startsWith(month) && e.text.trim() !== '')
}

function monthFigures(entries: Entry[]) {
  let chars = 0
  let corrected = 0
  let errors = 0
  let correctedChars = 0
  for (const e of entries) {
    chars += countChars(e.text)
    if (e.correction && countChars(e.correction.sourceText) >= 10) {
      corrected++
      errors += e.correction.errors.length
      correctedChars += countChars(e.correction.sourceText)
    }
  }
  return {
    days: entries.length,
    chars,
    average: entries.length ? Math.round(chars / entries.length) : 0,
    corrected,
    errors,
    per100: correctedChars > 0 ? (errors / correctedChars) * 100 : null,
  }
}

export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthReview(all: Entry[], month: string): MonthReviewData {
  const mine = inMonth(all, month)
  const before = inMonth(all, previousMonth(month))
  const fig = monthFigures(mine)
  const prevFig = monthFigures(before)

  const kindCount = (list: Entry[]) => {
    const m = new Map<ErrorKind, number>()
    for (const e of list)
      for (const x of e.correction?.errors ?? []) m.set(x.kind, (m.get(x.kind) ?? 0) + 1)
    return m
  }
  const now = kindCount(mine)
  const was = kindCount(before)
  const kinds = [...new Set([...now.keys(), ...was.keys()])]
    .map((kind) => ({ kind, count: now.get(kind) ?? 0, prev: was.get(kind) ?? 0 }))
    .sort((a, b) => b.count - a.count || b.prev - a.prev)

  // Grammaire : première réussite de chaque point, et points à revoir.
  const sorted = [...all].filter((e) => e.correction).sort((a, b) => a.id.localeCompare(b.id))
  const firstGood = new Map<string, { id: string; label: string }>()
  const lastGood = new Map<string, string>()
  for (const e of sorted)
    for (const g of e.correction!.grammarGood) {
      const label = plainText(g.point).trim()
      const key = patternKey(label)
      if (!firstGood.has(key)) firstGood.set(key, { id: e.id, label })
      lastGood.set(key, e.id)
    }
  const newlyGood = [...firstGood.values()].filter((g) => g.id.startsWith(month)).map((g) => g.label)

  const firstReview = new Map<string, { id: string; label: string }>()
  for (const e of sorted) {
    if (!e.id.startsWith(month)) continue
    for (const g of e.correction!.grammarReview) {
      const label = plainText(g.point).trim()
      const key = patternKey(label)
      if (!firstReview.has(key)) firstReview.set(key, { id: e.id, label })
    }
  }
  const recovered: string[] = []
  const stillReview: string[] = []
  for (const [key, r] of firstReview) {
    const good = lastGood.get(key)
    if (good && good > r.id) recovered.push(r.label)
    else stillReview.push(r.label)
  }

  let proposed = 0
  let used = 0
  for (const e of mine) {
    if (!e.prompt) continue
    for (const w of e.prompt.words) {
      proposed++
      if (wordUsed(w, e.text)) used++
    }
  }

  return {
    month,
    ...fig,
    prev: { days: prevFig.days, average: prevFig.average, per100: prevFig.per100 },
    kinds,
    newlyGood,
    recovered,
    stillReview,
    words: { proposed, used },
  }
}
