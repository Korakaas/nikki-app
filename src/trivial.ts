import { plainText } from './furigana'
import type { Correction, CorrectionItem, Entry } from './types'

/*
  Ce qu'on ne corrige pas : la ponctuation, les largeurs de caractères, les espaces
  et les lettres tapées par erreur au milieu d'un mot. Ces filtres complètent la consigne
  donnée à Claude (api.ts) : même si le modèle en signale une, elle est écartée ici,
  y compris dans les corrections déjà enregistrées.
*/

const PUNCTUATION = /[\s　。、，．,.!?！？「」『』（）()［］\[\]【】・･－\-—–"'“”‘’:：;；]/g

function norm(s: string): string {
  return s
    .normalize('NFKC')
    // « 3ー4 », « 3〜4 », « 3~4 » : même signe d'intervalle entre deux nombres.
    .replace(/(\d)[ー〜~-](?=\d)/g, '$1~')
    .replace(PUNCTUATION, '')
}

/** Vrai quand la « correction » ne change que de la ponctuation, des espaces, la largeur des caractères ou des lettres parasites. */
export function isTrivialFix(item: Pick<CorrectionItem, 'original' | 'corrected'>): boolean {
  const before = norm(item.original)
  const after = norm(plainText(item.corrected))
  if (before === after) return true
  // « k今日 » → « 今日 » : une lettre latine tapée par erreur.
  return before.replace(/[A-Za-z0-9]/g, '') === after && /[A-Za-z]/.test(item.original)
}

export function cleanCorrection(c: Correction): Correction {
  const errors = c.errors.filter((e) => !isTrivialFix(e))
  return errors.length === c.errors.length ? c : { ...c, errors }
}

export function cleanEntry(e: Entry): Entry {
  if (!e.correction) return e
  const correction = cleanCorrection(e.correction)
  return correction === e.correction ? e : { ...e, correction }
}
