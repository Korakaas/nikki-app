import { plainText } from './furigana'

/** Formes à chercher dans le texte pour dire qu'un mot du jour a été employé. */
export function wordForms(word: { ja: string; reading?: string }): string[] {
  const plain = plainText(word.ja)
    .replace(/[〜～~（）()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const forms = new Set<string>()
  for (const part of plain.split(/[／/・、,;\s]+/)) {
    let base = part.trim()
    if (!base) continue
    forms.add(base)
    // 勉強する → 勉強 (le nom suffit) ; 食べる → 食べ ; 寒い → 寒 ; 静かな → 静か.
    base = base.replace(/する$/, '')
    const hasKanji = /\p{Script=Han}/u.test(base)
    let stem = base
    if (/[るいうくぐすつぬぶむ]$/.test(base) && base.length >= 2) stem = base.slice(0, -1)
    else if (/な$/.test(base) && base.length >= 3) stem = base.slice(0, -1)
    // Une racine d'un seul kana irait partout : on exige un kanji, ou 3 kana.
    if (stem.length >= 3 || (hasKanji && /\p{Script=Han}/u.test(stem))) forms.add(stem)
    if (base !== part && base.length >= 2) forms.add(base)
  }
  return [...forms]
}

/** Le mot du jour apparaît-il dans ce texte (conjugué ou non) ? */
export function wordUsed(word: { ja: string; reading?: string }, text: string): boolean {
  if (!text.trim()) return false
  const t = text.normalize('NFKC')
  return wordForms(word).some((f) => f.length > 0 && t.includes(f.normalize('NFKC')))
}
