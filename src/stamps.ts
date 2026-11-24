import { countChars } from './format'
import { goodPoints, timesUsed } from './stats'
import { wordUsed } from './words'
import type { Entry, StampKind } from './types'

/** Ce qu'il faut savoir d'une entrée pour lui donner un tampon (jamais le nombre de fautes). */
type StampInput = Pick<Entry, 'text' | 'correction' | 'prompt'>

const RANK: Record<StampKind, number> = { ganbari: 1, yoku: 2, hanamaru: 3 }

/** Le plus beau des deux (un tampon ne s'enlève jamais). */
export function bestStamp(a?: StampKind | null, b?: StampKind | null): StampKind | undefined {
  if (!a) return b ?? undefined
  if (!b) return a
  return RANK[a] >= RANK[b] ? a : b
}

/**
 * Le tampon mérité d'après ce qui est écrit et réussi (S18.19, validé par Kora le 24/11) :
 * - がんばりました : deux phrases écrites (ou 20 caractères) ;
 * - よくできました : la correction juge le point de grammaire du jour bien employé ;
 * - 花丸 : en plus, au moins un mot du jour est employé.
 */
export function earnedStamp(e: StampInput): StampKind | null {
  const text = e.text.trim()
  if (text === '') return null
  const sentences = (text.match(/[。！？!?]/g) ?? []).length
  if (sentences < 2 && countChars(text) < 20) return null
  const prompt = e.prompt
  if (!prompt || prompt.themeOnly || !e.correction) return 'ganbari'
  const placed = timesUsed(prompt.grammar.pattern, goodPoints([e as Entry])) > 0
  if (!placed) return 'ganbari'
  const wordIn = prompt.words.some((w) => wordUsed(w, e.text))
  return wordIn ? 'hanamaru' : 'yoku'
}

/** Le tampon à montrer : le meilleur entre celui déjà gardé et celui d'aujourd'hui. */
export function shownStamp(e: StampInput & { stamp?: StampKind }): StampKind | null {
  if (e.text.trim() === '') return null
  return bestStamp(e.stamp, earnedStamp(e)) ?? null
}
