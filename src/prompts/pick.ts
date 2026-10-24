import type { DailyPrompt, Settings } from '../types'
import { GRAMMAR, TOPICS, VOCAB, type GrammarPoint } from './data'

/** Générateur pseudo-aléatoire déterministe : même date + même variante = même idée. */
function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function choose<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)]
}

interface PickOptions {
  level: Settings['targetLevel']
  dateId: string
  variant: number
  /** Points de grammaire déjà proposés récemment : on évite de les répéter. */
  recentPatterns?: string[]
  /** Sujet de l'idée précédente, pour ne pas le redonner tel quel. */
  currentTopic?: string
}

export function pickPrompt(options: PickOptions): DailyPrompt {
  const { level, dateId, variant, recentPatterns = [], currentTopic } = options
  const rand = mulberry32(hash(`${dateId}#${variant}`))

  // N4 : points N4 seulement. N3 : surtout N3, avec un N4 sur trois pour consolider.
  const wantLevel =
    level === 'N4' ? 'N4' : rand() < 1 / 3 ? 'N4' : 'N3'
  const fresh = (g: GrammarPoint) => !recentPatterns.includes(g.pattern)
  let pool = GRAMMAR.filter((g) => g.level === wantLevel && fresh(g))
  if (pool.length === 0) pool = GRAMMAR.filter((g) => g.level === wantLevel)
  const grammar = choose(rand, pool)

  let topics = TOPICS.filter((t) => t.ja !== currentTopic)
  if (topics.length === 0) topics = TOPICS
  const topic = choose(rand, topics)

  // 3 mots du thème, au niveau visé (N4 : mots N4 d'abord ; N3 : tous niveaux).
  const themeWords = VOCAB[topic.theme]
  const preferred =
    level === 'N4' ? themeWords.filter((w) => w.level === 'N4') : themeWords
  const source = preferred.length >= 3 ? preferred : themeWords
  const pickedWords = [...source]
  for (let i = pickedWords.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pickedWords[i], pickedWords[j]] = [pickedWords[j], pickedWords[i]]
  }
  const words = pickedWords
    .slice(0, 3)
    .map(({ ja, reading, fr }) => ({ ja, reading, fr }))

  return {
    variant,
    topic: { ja: topic.ja, fr: topic.fr },
    grammar: {
      pattern: grammar.pattern,
      fr: grammar.fr,
      level: grammar.level,
      example: grammar.example,
      exampleFr: grammar.exampleFr,
    },
    words,
  }
}
