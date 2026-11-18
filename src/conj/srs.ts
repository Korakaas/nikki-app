import { addDays } from '../format'
import { conjugate, FORMS, isTricky, MAX_STAGE, type FormId, type Verb } from './engine'

/** Une carte = un verbe × une forme (ou × « quel groupe ? »). */
export interface Card {
  /** 0 = à revoir tout de suite, 5 = bien acquise. */
  box: number
  /** Jour de la prochaine révision (YYYY-MM-DD). */
  due: string
  right: number
  wrong: number
  last: number
}

export interface ConjState {
  cards: Record<string, Card>
  /** Paliers de formes débloqués (1 à 4). */
  stage: number
  /** Dernières réponses écrites (vrai = juste), pour décider du déblocage. */
  recent: boolean[]
  /** Verbes retirés (mauvais groupe, mauvaise lecture…). */
  hidden: string[]
}

export const EMPTY_CONJ: ConjState = { cards: {}, stage: 1, recent: [], hidden: [] }

/** Jours avant la prochaine révision, selon la boîte atteinte. */
export const INTERVALS = [0, 1, 3, 7, 14, 30]
export const ACQUIRED_BOX = 4
const UNLOCK_WINDOW = 20
const UNLOCK_RATE = 0.75

export const GROUP_FORM = 'group'
export type CardForm = FormId | typeof GROUP_FORM

export function cardKey(verb: Verb, form: CardForm): string {
  return `${verb.ja}|${form}`
}

export function cardVerb(key: string): string {
  return key.slice(0, key.lastIndexOf('|'))
}

export function cardForm(key: string): string {
  return key.slice(key.lastIndexOf('|') + 1)
}

export function normalizeConj(raw: Partial<ConjState> | undefined | null): ConjState {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_CONJ, cards: {}, recent: [], hidden: [] }
  return {
    cards: raw.cards && typeof raw.cards === 'object' ? raw.cards : {},
    stage: Math.min(MAX_STAGE, Math.max(1, Number(raw.stage) || 1)),
    recent: Array.isArray(raw.recent) ? raw.recent.filter((x) => typeof x === 'boolean').slice(-UNLOCK_WINDOW) : [],
    hidden: Array.isArray(raw.hidden) ? raw.hidden.filter((x) => typeof x === 'string') : [],
  }
}

/** Fusion de deux appareils : carte la plus récente, palier le plus haut, retraits cumulés. */
export function mergeConj(mine: ConjState, theirs: ConjState): ConjState {
  const cards = { ...mine.cards }
  for (const [key, c] of Object.entries(theirs.cards)) {
    if (!cards[key] || cards[key].last < c.last) cards[key] = c
  }
  return {
    cards,
    stage: Math.max(mine.stage, theirs.stage),
    recent: mine.recent,
    hidden: [...new Set([...mine.hidden, ...theirs.hidden])],
  }
}

/** Formes accessibles au palier courant. */
export function unlockedForms(state: ConjState): FormId[] {
  return FORMS.filter((f) => f.stage <= state.stage).map((f) => f.id)
}

/** Enregistre une réponse : bonne → boîte suivante, mauvaise → retour à la boîte 0. */
export function answerCard(
  state: ConjState,
  key: string,
  right: boolean,
  today: string,
  now = Date.now(),
): ConjState {
  const old = state.cards[key]
  const box = right ? Math.min(INTERVALS.length - 1, (old?.box ?? 0) + 1) : 0
  const card: Card = {
    box,
    due: addDays(today, INTERVALS[box]),
    right: (old?.right ?? 0) + (right ? 1 : 0),
    wrong: (old?.wrong ?? 0) + (right ? 0 : 1),
    last: now,
  }
  let next: ConjState = { ...state, cards: { ...state.cards, [key]: card } }
  if (cardForm(key) !== GROUP_FORM) {
    next = { ...next, recent: [...state.recent, right].slice(-UNLOCK_WINDOW) }
    next = unlockIfReady(next)
  }
  return next
}

/** Passe au palier suivant quand les 20 dernières réponses sont justes à 75 % ou plus. */
export function unlockIfReady(state: ConjState): ConjState {
  if (state.stage >= MAX_STAGE || state.recent.length < UNLOCK_WINDOW) return state
  const rate = state.recent.filter(Boolean).length / state.recent.length
  return rate >= UNLOCK_RATE ? { ...state, stage: state.stage + 1, recent: [] } : state
}

export function unlockAll(state: ConjState): ConjState {
  return { ...state, stage: MAX_STAGE, recent: [] }
}

export function hideVerb(state: ConjState, ja: string): ConjState {
  return state.hidden.includes(ja) ? state : { ...state, hidden: [...state.hidden, ja] }
}

export function restoreVerbs(state: ConjState): ConjState {
  return { ...state, hidden: [] }
}

export interface SessionItem {
  verb: Verb
  form: CardForm
  /** Carte déjà vue (révision) ou nouvelle. */
  fresh: boolean
}

/** Poids d'un verbe pour les nouvelles cartes : groupes équilibrés, pièges favorisés. */
function verbWeight(v: Verb, form: CardForm): number {
  const base = v.group === 'godan' ? 40 : v.group === 'ichidan' ? 40 : v.group === 'kuru' ? 20 : 8
  const tricky = isTricky(v) ? (form === GROUP_FORM ? 4 : 2) : 1
  return base * tricky
}

function pickWeighted<T>(items: T[], weight: (t: T) => number, rnd: () => number): T {
  const total = items.reduce((s, t) => s + weight(t), 0)
  let r = rnd() * total
  for (const t of items) {
    r -= weight(t)
    if (r <= 0) return t
  }
  return items[items.length - 1]
}

function isAvailable(state: ConjState, verb: Verb, form: CardForm): boolean {
  if (state.hidden.includes(verb.ja)) return false
  return form === GROUP_FORM || conjugate(verb, form) !== null
}

/** Cartes à revoir aujourd'hui (en retard d'abord, puis boîte la plus basse). */
export function dueItems(
  state: ConjState,
  verbs: Verb[],
  today: string,
  kind: 'form' | 'group',
): SessionItem[] {
  const byJa = new Map(verbs.map((v) => [v.ja, v]))
  const unlocked = new Set<string>(unlockedForms(state))
  const out: { item: SessionItem; due: string; box: number }[] = []
  for (const [key, c] of Object.entries(state.cards)) {
    const form = cardForm(key)
    if (kind === 'group' ? form !== GROUP_FORM : form === GROUP_FORM || !unlocked.has(form)) continue
    if (c.due > today) continue
    const verb = byJa.get(cardVerb(key))
    if (!verb || !isAvailable(state, verb, form as CardForm)) continue
    out.push({ item: { verb, form: form as CardForm, fresh: false }, due: c.due, box: c.box })
  }
  out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.box - b.box))
  return out.map((o) => o.item)
}

/** Construit une séance : les révisions dues d'abord, puis des cartes nouvelles. */
export function buildSession(
  state: ConjState,
  verbs: Verb[],
  today: string,
  kind: 'form' | 'group',
  size = 10,
  rnd: () => number = Math.random,
): SessionItem[] {
  const session = dueItems(state, verbs, today, kind).slice(0, size)
  const taken = new Set(session.map((s) => cardKey(s.verb, s.form)))
  const forms: CardForm[] = kind === 'group' ? [GROUP_FORM] : unlockedForms(state)
  const pool = verbs.filter((v) => !state.hidden.includes(v.ja))
  let guard = 0
  while (session.length < size && guard++ < size * 60 && pool.length > 0) {
    const form = forms[Math.floor(rnd() * forms.length)]
    const verb = pickWeighted(pool, (v) => verbWeight(v, form), rnd)
    const key = cardKey(verb, form)
    if (taken.has(key) || state.cards[key] || !isAvailable(state, verb, form)) continue
    taken.add(key)
    session.push({ verb, form, fresh: true })
  }
  // Mélange léger : les cartes dues ne sont pas toutes devant les nouvelles.
  for (let i = session.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[session[i], session[j]] = [session[j], session[i]]
  }
  return session
}

export interface ConjStats {
  seen: number
  acquired: number
  due: number
  /** Verbes sur lesquels tu te trompes le plus. */
  resistant: { verb: Verb; wrong: number; right: number }[]
  groupRight: number
  groupWrong: number
}

export function conjStats(state: ConjState, verbs: Verb[], today: string): ConjStats {
  const byJa = new Map(verbs.map((v) => [v.ja, v]))
  let seen = 0
  let acquired = 0
  let groupRight = 0
  let groupWrong = 0
  const perVerb = new Map<string, { wrong: number; right: number }>()
  for (const [key, c] of Object.entries(state.cards)) {
    const ja = cardVerb(key)
    if (!byJa.has(ja) || state.hidden.includes(ja)) continue
    if (cardForm(key) === GROUP_FORM) {
      groupRight += c.right
      groupWrong += c.wrong
    } else {
      seen++
      if (c.box >= ACQUIRED_BOX) acquired++
    }
    const p = perVerb.get(ja) ?? { wrong: 0, right: 0 }
    p.wrong += c.wrong
    p.right += c.right
    perVerb.set(ja, p)
  }
  const resistant = [...perVerb.entries()]
    .filter(([, p]) => p.wrong >= 2 && p.wrong >= p.right * 0.5)
    .sort((a, b) => b[1].wrong - b[1].right - (a[1].wrong - a[1].right))
    .slice(0, 6)
    .map(([ja, p]) => ({ verb: byJa.get(ja)!, ...p }))
  return {
    seen,
    acquired,
    due: dueItems(state, verbs, today, 'form').length + dueItems(state, verbs, today, 'group').length,
    resistant,
    groupRight,
    groupWrong,
  }
}
