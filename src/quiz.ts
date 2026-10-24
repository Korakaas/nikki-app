import { plainText } from './furigana'
import type { Entry, ErrorKind } from './types'

export interface QuizItem {
  key: string
  entryId: string
  kind: ErrorKind
  /** Passage fautif tel que tu l'avais écrit. */
  original: string
  /** Passage corrigé, avec balisage de furigana. */
  corrected: string
  correctPlain: string
  explanation: string
  /** Phrase d'origine où le passage a été remplacé par un blanc. */
  context?: string
}

export interface QuizQuestion {
  item: QuizItem
  options: string[]
}

export type QuizHistory = Record<string, { right: number; wrong: number; last: number }>

const BLANK = '＿＿＿'

function sentenceWith(source: string, passage: string): string | undefined {
  const parts = source.split(/(?<=[。！？!?\n])/)
  const found = parts.find((p) => p.includes(passage))
  return found?.trim().replace(passage, BLANK)
}

/** Toutes les erreurs corrigées, une seule fois chacune. */
export function collectItems(entries: Entry[]): QuizItem[] {
  const seen = new Set<string>()
  const items: QuizItem[] = []
  for (const entry of entries) {
    for (const e of entry.correction?.errors ?? []) {
      const correctPlain = plainText(e.corrected).trim()
      const original = e.original.trim()
      if (!original || !correctPlain || original === correctPlain) continue
      const key = `${original}→${correctPlain}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({
        key,
        entryId: entry.id,
        kind: e.kind,
        original,
        corrected: e.corrected,
        correctPlain,
        explanation: e.explanation,
        context: sentenceWith(entry.correction!.sourceText, original),
      })
    }
  }
  return items
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const DAY = 86_400_000

/** Plus de poids aux types d'erreurs fréquents, aux ratés passés, et moins à ce qui vient d'être réussi. */
export function weightOf(
  item: QuizItem,
  kindCounts: Map<ErrorKind, number>,
  history: QuizHistory,
  now: number,
): number {
  const base = 1 + (kindCounts.get(item.kind) ?? 0)
  const h = history[item.key]
  if (!h) return base * 2
  if (now - h.last < DAY * 0.8 && h.right >= h.wrong) return base * 0.05
  if (h.wrong > h.right) return base * 3
  return base / (1 + h.right)
}

export function buildQuiz(
  items: QuizItem[],
  history: QuizHistory,
  count = 5,
  rand: () => number = Math.random,
  now = Date.now(),
): QuizQuestion[] {
  const kindCounts = new Map<ErrorKind, number>()
  for (const it of items) kindCounts.set(it.kind, (kindCounts.get(it.kind) ?? 0) + 1)

  const pool = [...items]
  const chosen: QuizItem[] = []
  while (chosen.length < count && pool.length > 0) {
    const weights = pool.map((it) => weightOf(it, kindCounts, history, now))
    let roll = rand() * weights.reduce((a, b) => a + b, 0)
    let index = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i]
      if (roll < 0) {
        index = i
        break
      }
    }
    chosen.push(pool.splice(index, 1)[0])
  }

  return chosen.map((item) => {
    // Pièges : la forme fautive, puis des formes correctes d'autres phrases (même type d'abord).
    const others = items
      .filter((o) => o.key !== item.key && o.correctPlain !== item.correctPlain && o.correctPlain !== item.original)
      .sort(
        (a, b) =>
          Number(b.kind === item.kind) - Number(a.kind === item.kind) ||
          Math.abs(a.correctPlain.length - item.correctPlain.length) -
            Math.abs(b.correctPlain.length - item.correctPlain.length),
      )
    const distractors = [...new Set(others.map((o) => o.correctPlain))].slice(0, 2)
    return {
      item,
      options: shuffle([item.correctPlain, item.original, ...distractors], rand),
    }
  })
}
