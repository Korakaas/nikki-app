import { particleQuestionsFor, particleSwap } from './particles'
import { plainText } from './furigana'
import type { QuizHistory, QuizQuestion } from './quiz'
import { pairQuestions, transitivityLinkOf } from './transitivity'
import type { CorrectionItem } from './types'
import type { VerbPair } from './transitivity'

/** L'exercice lié à une faute (S8.3) : des particules, ou une paire transitif / intransitif. */
export type FaultLink = { type: 'particle' } | { type: 'pair'; pair: VerbPair }

/** Y a-t-il un exercice pour cette faute ? Sinon, pas de bouton « S'entraîner ». */
export function faultLink(e: CorrectionItem, sourceText: string): FaultLink | null {
  const original = e.original.trim()
  const fixed = plainText(e.corrected).trim()
  if (!original || !fixed || original === fixed) return null
  // Un verbe de paire confondu est plus précis qu'une simple particule.
  const pair = transitivityLinkOf(e, sourceText)
  if (pair && pair.kind === 'swap') return { type: 'pair', pair: pair.pair }
  if (particleSwap(original, fixed)) return { type: 'particle' }
  if (pair) return { type: 'pair', pair: pair.pair }
  return null
}

/** Trois questions au plus : la faute d'abord pour les particules, la paire de verbes sinon. */
export function faultSeries(
  link: FaultLink,
  e: CorrectionItem,
  sourceText: string,
  history: QuizHistory,
  count = 3,
): QuizQuestion[] {
  if (link.type === 'pair') return pairQuestions(link.pair, history, count)
  return particleQuestionsFor(e, sourceText, history, count) ?? []
}
