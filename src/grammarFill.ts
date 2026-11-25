/*
  Point du jour et phrases à trous (S8.1a) + retour des erreurs (S8.1b).

  Tout est local, aucun appel à l'API : on prend la phrase d'exemple d'un point de grammaire
  (liste intégrée, deck Anki, point visé par le bilan) et on cache le passage de grammaire.
  Chaque point n'a qu'un exemple : les trois phrases du jour viennent donc de trois points,
  le point du jour puis deux autres (de préférence un point raté plus tôt, qui revient).

  Les réponses vont dans l'historique des exercices (clé « gf| »), jamais dans les statistiques
  d'écriture ni dans les séries. « Passer » n'enregistre rien.
*/

import { activeLibrary, patternKey } from './anki'
import { dayNumber } from './formats'
import { parseMarkup, plainText } from './furigana'
import { GRAMMAR } from './prompts/data'
import type { QuizHistory } from './quiz'
import type { AnkiLibrary, Difficulty, WeeklyReview } from './types'

const BLANK = '＿＿＿'
const DAY = 86400000

export interface FillPoint {
  pattern: string
  fr: string
  level: 'N4' | 'N3' | 'N2'
  example: string
  exampleFr: string
  fromAnki?: boolean
  fromReview?: boolean
}

export interface FillQuestion {
  /** Clé de l'historique : « gf|… ». */
  key: string
  pattern: string
  level: 'N4' | 'N3' | 'N2'
  /** Sens du point, en français (sans le point lui-même, qui est la réponse). */
  meaning: string
  /** Phrase balisée avec le blanc. */
  frame: string
  /** La phrase en français. */
  fr: string
  /** Réponses acceptées. */
  answers: string[]
  /** Phrase complète balisée, pour montrer la bonne forme. */
  full: string
  fromAnki?: boolean
  fromReview?: boolean
}

const KANA_ONLY = /^[ぁ-ゟ゠-ヿー]+$/
const HIRAGANA = /[ぁ-ゟ]/

/** Les formes à chercher dans la phrase : le point entier, puis privé de sa fin (ことになる → ことにな). */
function cores(pattern: string): string[] {
  const noNotes = pattern.replace(/[（(][^）)]*[）)]/g, '')
  const first = noNotes.split(/[／/]/)[0].replace(/[〜～~\s]/g, '')
  if (!first || !KANA_ONLY.test(first)) return []
  const out = [first]
  if (first.length >= 3) out.push(first.slice(0, -1))
  if (first.length >= 4) out.push(first.slice(0, -2))
  return out
}

/** Cache le passage de grammaire dans la phrase d'exemple ; null si on ne le trouve pas proprement. */
export function blankOf(p: FillPoint): FillQuestion | null {
  const segments = parseMarkup(p.example)
  const forms = cores(p.pattern)
  for (const core of forms) {
    // On cherche la dernière occurrence : c'est presque toujours celle du point (…のものです, …ことになりました).
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i]
      if (seg.type !== 'text') continue
      const at = seg.text.lastIndexOf(core)
      if (at < 0) continue
      // Le blanc va jusqu'à la fin du mot en hiragana (ことにな → ことになりました).
      let end = at + core.length
      while (end < seg.text.length && HIRAGANA.test(seg.text[end]) && !'、。'.includes(seg.text[end])) end++
      const hidden = seg.text.slice(at, end)
      // Un blanc trop long n'apprend rien ; une forme raccourcie de moins de trois signes est trop vague.
      if (hidden.length > 9 || (core !== forms[0] && core.length < 3)) return null
      const rebuilt = segments.map((s, j) => {
        if (s.type === 'ruby') return `{${s.base}|${s.reading}}`
        return j === i ? s.text.slice(0, at) + BLANK + s.text.slice(end) : s.text
      })
      return {
        key: `gf|${patternKey(p.pattern)}`,
        pattern: p.pattern,
        level: p.level,
        meaning: p.fr,
        frame: rebuilt.join(''),
        fr: p.exampleFr,
        // Le point seul (sans la fin polie de la phrase) est accepté aussi.
        answers: hidden === forms[0] ? [hidden] : [hidden, forms[0]],
        full: p.example,
        ...(p.fromAnki ? { fromAnki: true } : {}),
        ...(p.fromReview ? { fromReview: true } : {}),
      }
    }
  }
  return null
}

function normalize(s: string): string {
  return s.normalize('NFKC').replace(/\s+/g, '').replace(/[。.]$/, '')
}

/** La réponse tapée est bonne si elle est identique, en kana (les kanji de la phrase restent affichés). */
export function checkFill(q: FillQuestion, typed: string): boolean {
  const clean = normalize(typed)
  return clean !== '' && q.answers.some((a) => normalize(a) === clean)
}

const LEVELS: Record<Difficulty, ('N4' | 'N3' | 'N2')[]> = {
  n3: ['N4', 'N3'],
  mixed: ['N4', 'N3', 'N2'],
  n2: ['N3', 'N2'],
}

/** Tous les points qui ont une phrase à trous propre, selon la difficulté (le deck compte à tous les niveaux). */
export function fillPool(
  difficulty: Difficulty,
  library: AnkiLibrary | null | undefined,
  focus?: WeeklyReview['focus'] | null,
): FillQuestion[] {
  const own = activeLibrary(library).grammar
  const ownKeys = new Set(own.map((g) => patternKey(g.pattern)))
  const levels = LEVELS[difficulty]
  const points: FillPoint[] = [
    ...own.map((g) => ({ ...g, fromAnki: true })),
    ...GRAMMAR.filter((g) => levels.includes(g.level) && !ownKeys.has(patternKey(g.pattern))),
  ]
  if (focus) {
    const k = patternKey(focus.pattern)
    const i = points.findIndex((p) => patternKey(p.pattern) === k)
    const fromReview = { ...focus, fromReview: true }
    if (i >= 0) points[i] = { ...points[i], fromReview: true }
    else points.push(fromReview)
  }
  const seen = new Set<string>()
  const out: FillQuestion[] = []
  for (const p of points) {
    const q = blankOf(p)
    if (!q || seen.has(q.key)) continue
    seen.add(q.key)
    out.push(q)
  }
  return out
}

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Un point raté (plus de ratés que de réussites) revient dès le lendemain, jusqu'à ce qu'il soit réussi. */
export function isDue(q: FillQuestion, history: QuizHistory, now: number): boolean {
  const h = history[q.key]
  return Boolean(h && !h.hidden && h.wrong > h.right && now - h.last >= DAY * 0.8)
}

function weight(q: FillQuestion, history: QuizHistory, now: number): number {
  const base = (q.fromAnki ? 1.6 : 1) * (q.fromReview ? 4 : 1)
  const h = history[q.key]
  if (!h) return base * 2
  if (now - h.last < DAY * 0.8) return base * 0.05
  if (h.wrong > h.right) return base * 3
  // Réussi : il s'espace, de plus en plus.
  return base / (1 + h.right)
}

function drawOne(pool: FillQuestion[], rand: () => number, history: QuizHistory, now: number): FillQuestion | null {
  if (pool.length === 0) return null
  const weights = pool.map((q) => weight(q, history, now))
  let roll = rand() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll < 0) return pool[i]
  }
  return pool[pool.length - 1]
}

/**
 * Les trois phrases d'un jour : le point du jour (tiré au hasard d'après la date), puis un point à
 * revoir s'il y en a un (raté un autre jour), puis un autre point. Pour une même date et un même historique,
 * toujours les mêmes ; l'appli garde de toute façon le choix de la journée (voir db.loadFillDay).
 */
export function dailyFill(
  id: string,
  pool: FillQuestion[],
  history: QuizHistory,
  now: number,
  count = 3,
  extraSeed = '',
  exclude: string[] = [],
): FillQuestion[] {
  const rand = mulberry32(hash(`${id}#fill${extraSeed}`) + dayNumber(id))
  const left = pool.filter((q) => !history[q.key]?.hidden && !exclude.includes(q.key))
  const chosen: FillQuestion[] = []
  const take = (q: FillQuestion | null) => {
    if (!q) return
    chosen.push(q)
    const i = left.findIndex((x) => x.key === q.key)
    if (i >= 0) left.splice(i, 1)
  }
  take(drawOne(left, rand, history, now))
  const due = left.filter((q) => isDue(q, history, now))
  if (count > 1) take(due.length > 0 ? due[Math.floor(rand() * due.length)] : drawOne(left, rand, history, now))
  while (chosen.length < count && left.length > 0) take(drawOne(left, rand, history, now))
  return chosen
}

export function plainFrame(q: FillQuestion): string {
  return plainText(q.frame)
}
