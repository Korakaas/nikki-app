import { activeLibrary, patternKey } from '../anki'
import { timesUsed } from '../stats'
import type { AnkiLibrary, DailyPrompt, Settings } from '../types'
import { GRAMMAR, TOPICS, VOCAB } from './data'

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

function chooseWeighted<T>(rand: () => number, items: T[], weight: (item: T) => number): T {
  const weights = items.map(weight)
  let roll = rand() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]
    if (roll < 0) return items[i]
  }
  return items[items.length - 1]
}

interface PickOptions {
  level: Settings['targetLevel']
  dateId: string
  variant: number
  /** Points de grammaire déjà proposés récemment : on évite de les répéter. */
  recentPatterns?: string[]
  /** Mots déjà proposés récemment (deck Anki) : on évite de les répéter. */
  recentWords?: string[]
  /** Sujet de l'idée précédente, pour ne pas le redonner tel quel. */
  currentTopic?: string
  /** Cartes importées depuis Anki (facultatif). */
  library?: AnkiLibrary | null
  /** Points déjà bien employés (voir stats.goodPoints) : on préfère ceux qui ne le sont pas encore. */
  good?: string[][]
}

export function pickPrompt(options: PickOptions): DailyPrompt {
  const { level, dateId, variant, recentPatterns = [], recentWords = [], currentTopic } =
    options
  const rand = mulberry32(hash(`${dateId}#${variant}`))

  const anki = activeLibrary(options.library)
  const fresh = (pattern: string) => !recentPatterns.includes(pattern)
  const ownKeys = new Set(anki.grammar.map((g) => patternKey(g.pattern)))
  const builtin = (lvl: 'N4' | 'N3') =>
    GRAMMAR.filter(
      (g) =>
        g.level === lvl && fresh(g.pattern) && !ownKeys.has(patternKey(g.pattern)),
    )
  const own = anki.grammar.filter((g) => fresh(g.pattern))

  // N4 : points N4 seulement.
  // N3 : un point N4 sur quatre pour consolider ; avec un deck importé, la moitié des
  // points viennent du deck, sinon la liste intégrée N3.
  let kind: 'n4' | 'n3' | 'deck' = 'n4'
  if (level === 'N3') {
    const roll = rand()
    if (anki.grammar.length > 0) kind = roll < 0.25 ? 'n4' : roll < 0.5 ? 'n3' : 'deck'
    else kind = roll < 1 / 3 ? 'n4' : 'n3'
  }
  const asPrompt = (
    g: { pattern: string; fr: string; level: 'N4' | 'N3' | 'N2'; example: string; exampleFr: string },
    fromAnki: boolean,
  ): DailyPrompt['grammar'] => ({
    pattern: g.pattern,
    fr: g.fr,
    level: g.level,
    example: g.example,
    exampleFr: g.exampleFr,
    ...(fromAnki ? { fromAnki: true } : {}),
  })
  const pools: Record<typeof kind, DailyPrompt['grammar'][]> = {
    n4: builtin('N4').map((g) => asPrompt(g, false)),
    n3: builtin('N3').map((g) => asPrompt(g, false)),
    deck: own.map((g) => asPrompt(g, true)),
  }
  let chosen = pools[kind]
  if (chosen.length === 0) chosen = [...pools.deck, ...pools.n3, ...pools.n4]
  if (chosen.length === 0) chosen = GRAMMAR.filter((g) => g.level === 'N4').map((g) => asPrompt(g, false))
  // Un point jamais bien employé a trois fois plus de chances d'être proposé.
  const good = options.good ?? []
  const grammar = chooseWeighted(rand, chosen, (g) =>
    timesUsed(g.pattern, good) === 0 ? 3 : 1,
  )

  let topics = TOPICS.filter((t) => t.ja !== currentTopic)
  if (topics.length === 0) topics = TOPICS
  const topic = choose(rand, topics)

  // Mots : un mot du thème du sujet + deux mots de ton deck (s'il y en a), sinon trois mots du thème.
  const themeWords = VOCAB[topic.theme]
  const preferred =
    level === 'N4' ? themeWords.filter((w) => w.level === 'N4') : themeWords
  const source = preferred.length >= 3 ? preferred : themeWords
  const shuffled = [...source]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const toWord = ({ ja, reading, fr }: { ja: string; reading: string; fr: string }) => ({
    ja,
    reading,
    fr,
  })

  const ownWords = anki.words.filter((w) => !recentWords.includes(w.ja))
  const fromDeck: ReturnType<typeof toWord>[] = []
  if (ownWords.length >= 2) {
    const taken = new Set<number>()
    while (fromDeck.length < 2) {
      const i = Math.floor(rand() * ownWords.length)
      if (taken.has(i)) continue
      taken.add(i)
      fromDeck.push(toWord(ownWords[i]))
    }
  }
  const words = [
    ...shuffled.slice(0, 3 - fromDeck.length).map(toWord),
    ...fromDeck,
  ]

  return {
    variant,
    topic: { ja: topic.ja, fr: topic.fr },
    grammar,
    words,
  }
}
