const WEEKDAYS_KANA = [
  'にちようび',
  'げつようび',
  'かようび',
  'すいようび',
  'もくようび',
  'きんようび',
  'どようび',
]

/**
 * « 10月23日きんようび » à partir d'un identifiant YYYY-MM-DD,
 * comme on l'écrit en tête d'une page de journal. L'année n'est ajoutée que sur demande.
 */
export function formatDateJa(id: string, withYear = false): string {
  const [y, m, d] = id.split('-').map(Number)
  const weekday = WEEKDAYS_KANA[new Date(y, m - 1, d).getDay()]
  return `${withYear ? `${y}年` : ''}${m}月${d}日${weekday}`
}

/** Compte les caractères « utiles » (sans espaces ni retours à la ligne). */
export function countChars(text: string): number {
  return Array.from(text.replace(/\s/g, '')).length
}

/** Identifiant du jour décalé de `delta` jours (YYYY-MM-DD, heure locale). */
export function addDays(id: string, delta: number): string {
  const [y, m, d] = id.split('-').map(Number)
  const date = new Date(y, m - 1, d + delta)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}
