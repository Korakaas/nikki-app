import { patternKey } from './anki'
import { countChars } from './format'
import { plainText } from './furigana'
import { daysBetween } from './stats'
import { todayId } from './db'
import type { ConjState } from './conj/srs'
import type { QuizHistory } from './quiz'
import type { Entry, WeeklyReview } from './types'

/** Tout ce dont le calcul des succès a besoin : les données déjà gardées sur le téléphone. */
export interface AchievementData {
  entries: Entry[]
  reviews: WeeklyReview[]
  quiz: QuizHistory
  conj: ConjState
}

export type Family = 'ecrire' | 'volume' | 'correction' | 'pratique'

export interface Achievement {
  id: string
  name: string
  condition: string
  family: Family
  /** Condition remplie d'après les données. */
  done: boolean
  /** Jour où la condition a été remplie pour la première fois (YYYY-MM-DD). */
  date: string | null
  /** Progression chiffrée, quand elle a un sens (absente pour « une première fois »). */
  progress?: { value: number; target: number }
}

interface Computed {
  date: string | null
  value?: number
  target?: number
}

interface Def {
  id: string
  name: string
  condition: string
  family: Family
  compute: (d: Prepared) => Computed
}

interface Prepared extends AchievementData {
  /** Entrées écrites, de la plus ancienne à la plus récente. */
  written: Entry[]
  days: string[]
}

/** Jour local (YYYY-MM-DD) d'un instant. */
function dayOf(ms: number): string {
  return todayId(new Date(ms))
}

function countDays(d: Prepared, target: number): Computed {
  return { date: d.days.length >= target ? d.days[target - 1] : null, value: Math.min(d.days.length, target), target }
}

/** Série douce : un jour sauté ne coupe pas, deux jours entiers de suite oui. */
function streakDay(days: string[], target: number): { date: string | null; best: number } {
  let run = 0
  let best = 0
  let date: string | null = null
  let previous = ''
  for (const day of days) {
    run = previous && daysBetween(previous, day) <= 2 ? run + 1 : 1
    best = Math.max(best, run)
    if (run >= target && !date) date = day
    previous = day
  }
  return { date, best }
}

function streak(d: Prepared, target: number): Computed {
  const s = streakDay(d.days, target)
  return { date: s.date, value: Math.min(s.best, target), target }
}

function charsReached(d: Prepared, target: number): Computed {
  let sum = 0
  let date: string | null = null
  for (const e of d.written) {
    sum += countChars(e.text)
    if (sum >= target && !date) date = e.id
  }
  return { date, value: Math.min(sum, target), target }
}

function distinctPoints(d: Prepared, target: number): Computed {
  const seen = new Set<string>()
  let date: string | null = null
  for (const e of d.written) {
    for (const g of e.correction?.grammarGood ?? []) {
      const key = patternKey(plainText(g.point))
      if (key) seen.add(key)
    }
    if (seen.size >= target && !date) date = e.id
  }
  return { date, value: Math.min(seen.size, target), target }
}

/** Dernier jour où quelque chose a été répondu : date approchée d'un cumul qui n'a pas d'historique. */
function lastAnswerDay(times: number[]): string | null {
  const last = Math.max(0, ...times)
  return last > 0 ? dayOf(last) : null
}

export const ACHIEVEMENTS: Def[] = [
  { id: 'premiere-page', name: 'Première page', condition: 'Une première entrée écrite', family: 'ecrire',
    compute: (d) => countDays(d, 1) },
  { id: 'une-semaine', name: 'Une semaine', condition: '7 jours écrits', family: 'ecrire',
    compute: (d) => countDays(d, 7) },
  { id: 'un-mois', name: 'Un mois', condition: '30 jours écrits', family: 'ecrire',
    compute: (d) => countDays(d, 30) },
  { id: 'cent-jours', name: 'Cent jours', condition: '100 jours écrits', family: 'ecrire',
    compute: (d) => countDays(d, 100) },
  { id: 'sept-de-suite', name: 'Sept de suite', condition: 'Une série de 7 jours', family: 'ecrire',
    compute: (d) => streak(d, 7) },
  { id: 'trente-de-suite', name: 'Trente de suite', condition: 'Une série de 30 jours', family: 'ecrire',
    compute: (d) => streak(d, 30) },
  {
    id: 'de-retour',
    name: 'De retour',
    condition: 'Une entrée écrite après une pause',
    family: 'ecrire',
    compute: (d) => {
      for (let i = 1; i < d.days.length; i++) {
        if (daysBetween(d.days[i - 1], d.days[i]) > 2) return { date: d.days[i] }
      }
      return { date: null }
    },
  },
  {
    id: 'rattrapage',
    name: 'Rattrapage',
    condition: 'Une entrée écrite pour un jour passé',
    family: 'ecrire',
    compute: (d) => {
      const late = d.written.find((e) => dayOf(e.createdAt) > e.id)
      return { date: late ? dayOf(late.createdAt) : null }
    },
  },
  { id: 'cinq-cents', name: '500 caractères', condition: '500 caractères écrits au total', family: 'volume',
    compute: (d) => charsReached(d, 500) },
  { id: 'deux-mille', name: '2 000 caractères', condition: '2 000 caractères au total', family: 'volume',
    compute: (d) => charsReached(d, 2000) },
  { id: 'dix-mille', name: '10 000 caractères', condition: '10 000 caractères au total', family: 'volume',
    compute: (d) => charsReached(d, 10000) },
  {
    id: 'longue-page',
    name: 'Longue page',
    condition: 'Une seule entrée de 150 caractères ou plus',
    family: 'volume',
    compute: (d) => {
      const lengths = d.written.map((e) => countChars(e.text))
      const hit = d.written.find((e) => countChars(e.text) >= 150)
      return { date: hit ? hit.id : null, value: Math.min(Math.max(0, ...lengths), 150), target: 150 }
    },
  },
  {
    id: 'premiere-correction',
    name: 'Première correction',
    condition: 'Une première entrée corrigée',
    family: 'correction',
    compute: (d) => {
      const times = d.written.filter((e) => e.correction).map((e) => e.correction!.createdAt)
      return { date: times.length ? dayOf(Math.min(...times)) : null }
    },
  },
  { id: 'dix-points', name: 'Dix points bien placés', condition: '10 points de grammaire différents bien employés',
    family: 'correction', compute: (d) => distinctPoints(d, 10) },
  { id: 'cinquante-points', name: 'Cinquante points bien placés', condition: '50 points de grammaire différents',
    family: 'correction', compute: (d) => distinctPoints(d, 50) },
  {
    id: 'page-sans-faute',
    name: 'Page sans faute',
    condition: 'Une correction sans aucune faute',
    family: 'correction',
    compute: (d) => {
      const hit = d.written.find((e) => e.correction && e.correction.errors.length === 0)
      return { date: hit ? hit.id : null }
    },
  },
  {
    id: 'premier-bilan',
    name: 'Premier bilan',
    condition: 'Un premier bilan de la semaine',
    family: 'correction',
    compute: (d) => {
      const times = d.reviews.map((r) => r.createdAt)
      return { date: times.length ? dayOf(Math.min(...times)) : null }
    },
  },
  {
    id: 'dix-reponses',
    name: 'Dix bonnes réponses',
    condition: '10 bonnes réponses au quiz d’erreurs',
    family: 'pratique',
    compute: (d) => {
      const rows = Object.values(d.quiz)
      const right = rows.reduce((n, r) => n + r.right, 0)
      return { date: right >= 10 ? lastAnswerDay(rows.map((r) => r.last)) : null, value: Math.min(right, 10), target: 10 }
    },
  },
  {
    id: 'dix-conjugaisons',
    name: 'Dix conjugaisons',
    condition: '10 conjugaisons réussies',
    family: 'pratique',
    compute: (d) => {
      const cards = Object.values(d.conj.cards)
      const right = cards.reduce((n, c) => n + c.right, 0)
      return { date: right >= 10 ? lastAnswerDay(cards.map((c) => c.last)) : null, value: Math.min(right, 10), target: 10 }
    },
  },
  {
    id: 'page-decoree',
    name: 'Page décorée',
    condition: 'Une entrée avec une photo ou un autocollant',
    family: 'pratique',
    compute: (d) => {
      const hit = d.written.find((e) => (e.photos?.length ?? 0) > 0 || (e.stickers?.length ?? 0) > 0)
      return { date: hit ? hit.id : null }
    },
  },
]

/** Calcule les 20 succès à partir des données. Fonction pure : rien n'est écrit ici. */
export function evaluateAchievements(data: AchievementData): Achievement[] {
  const written = data.entries
    .filter((e) => e.text.trim() !== '')
    .sort((a, b) => a.id.localeCompare(b.id))
  const prepared: Prepared = { ...data, written, days: written.map((e) => e.id) }
  return ACHIEVEMENTS.map((def) => {
    const c = def.compute(prepared)
    const progress = c.target ? { value: c.value ?? 0, target: c.target } : undefined
    return { id: def.id, name: def.name, condition: def.condition, family: def.family, done: c.date !== null, date: c.date, progress }
  })
}

/** Ce qui est gardé sur le téléphone : un succès débloqué ne se perd jamais, même si les données changent. */
export interface AchievementStore {
  /** Succès débloqués, avec le jour de déblocage. */
  unlocked: Record<string, string>
  /** Faux tant que les succès déjà mérités n'ont pas été attribués (sans célébration). */
  seeded: boolean
}

export const EMPTY_STORE: AchievementStore = { unlocked: {}, seeded: false }

export interface SyncResult {
  store: AchievementStore
  /** Succès tout juste débloqués : ce sont eux qu'on célèbre (jamais ceux de la première attribution). */
  fresh: Achievement[]
  /** Les 20 succès, avec les déblocages gardés. */
  all: Achievement[]
}

export function syncAchievements(data: AchievementData, stored: AchievementStore, today: string): SyncResult {
  const computed = evaluateAchievements(data)
  const unlocked = { ...stored.unlocked }
  const fresh: Achievement[] = []
  for (const a of computed) {
    if (a.done && !unlocked[a.id]) {
      unlocked[a.id] = a.date ?? today
      if (stored.seeded) fresh.push(a)
    }
  }
  const all = computed.map((a) => {
    const kept = unlocked[a.id]
    return kept ? { ...a, done: true, date: kept } : a
  })
  return { store: { unlocked, seeded: true }, fresh, all }
}
