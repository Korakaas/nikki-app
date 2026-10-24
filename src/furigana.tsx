import { Fragment } from 'react'
import { KANJI_BY_LEVEL } from './jlptKanji'
import type { FuriganaFrom } from './types'

/*
  Balisage des furigana dans les textes de correction :
    {漢字|かんじ}   kanji, lecture
  Le reste du texte est du texte brut. Un niveau en troisième position ({漢字|かんじ|N4})
  est toléré mais ignoré.

  Le niveau d'un groupe de kanji est calculé ici, d'après la liste JLPT des kanji
  (jlptKanji.ts) : c'est son kanji le plus difficile qui compte.
*/

const RANK: Record<string, number> = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 }

/** Rang minimal du mot pour afficher sa lecture, selon le réglage. */
const FROM_RANK: Record<FuriganaFrom, number> = {
  all: 0,
  N3: 3,
  N2: 4,
  N1: 5,
  none: Infinity,
}

const KANJI_RANK = new Map<string, number>()
for (const [level, kanji] of Object.entries(KANJI_BY_LEVEL)) {
  for (const ch of kanji) KANJI_RANK.set(ch, RANK[level])
}

const HAN = /\p{Script=Han}/u

/** Rang du kanji le plus difficile du groupe (kanji hors liste = N1). */
export function kanjiRank(base: string): number | undefined {
  let max: number | undefined
  for (const ch of base) {
    if (ch === '々' || !HAN.test(ch)) continue
    max = Math.max(max ?? 0, KANJI_RANK.get(ch) ?? RANK.N1)
  }
  return max
}

export function shouldShowReading(base: string, from: FuriganaFrom): boolean {
  if (from === 'none') return false
  const rank = kanjiRank(base)
  // Rien à lire (pas de kanji) : pas de furigana.
  if (rank === undefined) return false
  return rank >= FROM_RANK[from]
}

export type Segment =
  | { type: 'text'; text: string }
  | { type: 'ruby'; base: string; reading: string; level?: string }

const PATTERN = /\{([^{}|]+)\|([^{}|]+)(?:\|(N[1-5]))?\}/gi

export function parseMarkup(input: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  for (const m of input.matchAll(PATTERN)) {
    const index = m.index ?? 0
    if (index > last) segments.push({ type: 'text', text: input.slice(last, index) })
    segments.push({
      type: 'ruby',
      base: m[1],
      reading: m[2],
      level: m[3]?.toUpperCase(),
    })
    last = index + m[0].length
  }
  if (last < input.length) segments.push({ type: 'text', text: input.slice(last) })
  return segments
}

/** Texte sans balisage, tel qu'on l'écrirait normalement. */
export function plainText(input: string): string {
  return parseMarkup(input)
    .map((s) => (s.type === 'text' ? s.text : s.base))
    .join('')
}

interface JpProps {
  text: string
  furigana: FuriganaFrom
}

/** Affiche un texte japonais balisé, avec les furigana demandés par le réglage. */
export function Jp({ text, furigana }: JpProps) {
  return (
    <>
      {parseMarkup(text).map((s, i) =>
        s.type === 'text' ? (
          <Fragment key={i}>{s.text}</Fragment>
        ) : shouldShowReading(s.base, furigana) ? (
          <ruby key={i}>
            {s.base}
            <rp>(</rp>
            <rt>{s.reading}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <Fragment key={i}>{s.base}</Fragment>
        ),
      )}
    </>
  )
}
