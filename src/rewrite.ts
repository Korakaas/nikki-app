import { plainText } from './furigana'
import type { Correction } from './types'

/** Ton texte avec seulement les fautes relevées corrigées (sans furigana). */
export function applyFixes(correction: Pick<Correction, 'sourceText' | 'errors'>): string {
  let text = correction.sourceText
  for (const e of correction.errors) {
    const original = e.original.trim()
    if (original && text.includes(original)) text = text.replace(original, plainText(e.corrected).trim())
  }
  return text
}

/** Pour comparer : largeur normalisée, sans espaces ni ponctuation. */
export function squash(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\s。、,.!?！？「」『』（）()・…~〜～-]+/g, '')
}

export interface DiffPart {
  type: 'same' | 'wrong' | 'missing'
  text: string
}

/**
 * Compare ce que tu as tapé (`typed`) à la bonne version (`target`) caractère par caractère :
 * `same` = juste, `wrong` = en trop ou faux dans ta version, `missing` = ce qu'il fallait écrire.
 */
export function diffChars(typed: string, target: string): DiffPart[] {
  const a = [...typed]
  const b = [...target]
  const n = a.length
  const m = b.length
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])

  const parts: DiffPart[] = []
  const push = (type: DiffPart['type'], ch: string) => {
    const last = parts[parts.length - 1]
    if (last && last.type === type) last.text += ch
    else parts.push({ type, text: ch })
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('same', a[i])
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push('wrong', a[i++])
    } else {
      push('missing', b[j++])
    }
  }
  while (i < n) push('wrong', a[i++])
  while (j < m) push('missing', b[j++])
  return parts
}
