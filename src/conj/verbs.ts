import { activeLibrary } from '../anki'
import type { AnkiLibrary } from '../types'
import type { Group, Verb } from './engine'

/** Verbes en る qui se conjuguent comme ceux en う malgré une finale en え/い + る (reconnus par l'écriture). */
const GODAN_RU_KANJI = [
  '帰る', '返る', '切る', '知る', '入る', '走る', '減る', '滑る', '参る', '照る', '茂る', '練る',
  '握る', '散る', '湿る', '焦る', '蹴る', '捻る', '齧る', '千切る', '喋る', '混じる', '交じる', '弄る',
]
/** Les mêmes, quand le mot est écrit en kana seulement. */
const GODAN_RU_KANA = ['かじる', 'ちぎる', 'ひねる', 'いじる', 'しゃべる', 'にぎる', 'まじる']

/** Honorifiques et verbes d'existence : pas de forme ordinaire, on les laisse de côté. */
const SKIP = new Set(['下さる', 'ありがとう', 'ある', '有る', '在る', 'いる', '居る', '要る', 'なさる', 'くださる', 'いらっしゃる', 'おっしゃる', 'ござる'])

/** Locutions repérées à la main dans le deck. */
const PHRASES = new Set([
  '痛みが取れる', '腹が立つ', '口に合う', '事故に遭う', '高くつく', '安く済む',
  // mots qui finissent comme un verbe sans en être un
  'あいつ', 'やつ', 'おむつ', '紙おむつ', 'お八つ', 'しょっちゅう', 'しばらく', 'せっかく', 'ますます',
  'とうとう', 'ぶつぶつ', 'わくわく', 'かわいそう', 'ごちそう', '何となく', '負んぶ',
])

const KANA = /^[぀-ヿー]+$/
const ENDINGS = 'うくぐすつぬぶむる'
const RU_AMBIGUOUS = /[いきしちにひみりぎじぢびぴえけせてねへめれげぜでべぺ]る$/

/** Katakana → hiragana (モテる, ダブる…). */
function toHira(s: string): string {
  return s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

export function groupOf(ja: string, reading: string): Group {
  if (ja === 'する' || ja.endsWith('する')) return 'suru'
  if (ja === 'くる' || ja.endsWith('来る') || /[てで]くる$/.test(ja)) return 'kuru'
  if (!reading.endsWith('る')) return 'godan'
  if (GODAN_RU_KANJI.some((g) => ja.endsWith(g)) || GODAN_RU_KANA.some((g) => ja.endsWith(g))) return 'godan'
  // える / いる + る : groupe 2 sauf exceptions ci-dessus ; les autres (あ・う・お + る) : groupe 1.
  return RU_AMBIGUOUS.test(toHira(reading)) ? 'ichidan' : 'godan'
}

/** Les kana de `ja` doivent se retrouver, dans l'ordre, dans la lecture, avec au moins une syllabe par kanji. */
function readingFits(ja: string, reading: string): boolean {
  const kana = Array.from(ja).filter((c) => /[\u3040-\u309f]/.test(c))
  const kanji = Array.from(ja).length - kana.length
  if (reading.length < kana.length + kanji) return false
  let i = 0
  for (const c of reading) if (i < kana.length && c === kana[i]) i++
  return i === kana.length && reading.endsWith(kana.join('').slice(-1))
}

const HAS_KANJI = /\p{Script=Han}/u

/**
 * Repère les verbes d'un deck : mots dont la fin est un kana de la ligne う, et noms suivis de (する).
 * Le deck n'indique pas la nature des mots : ce qui ressemble à une phrase ou à une locution est écarté.
 */
export function deckVerbs(library: AnkiLibrary | null): Verb[] {
  if (!library) return []
  const out: Verb[] = []
  const seen = new Set<string>()
  for (const w of activeLibrary(library).words) {
    let ja = w.ja.trim()
    let reading = (w.reading ?? '').trim()
    const m = ja.match(/^(.+?)[(（]する[)）]$/)
    const suru = !!m
    if (m) {
      ja = m[1]
      reading = reading.replace(/[(（]する[)）]$/, '')
    }
    // Phrases, locutions, mots avec variantes ou précisions entre parenthèses.
    if (/[〜～／/・\s()（）,、。を]/.test(ja) || PHRASES.has(ja)) continue
    if (ja.length < 2 && !suru) continue
    const kana = reading || ja
    if (!KANA.test(kana)) continue

    if (suru) {
      const full = ja + 'する'
      if (seen.has(full)) continue
      seen.add(full)
      out.push({ ja: full, reading: kana + 'する', fr: w.fr, group: 'suru' })
      continue
    }

    if (!ENDINGS.includes(ja.slice(-1)) || !ENDINGS.includes(kana.slice(-1))) continue
    if (SKIP.has(ja)) continue
    if (HAS_KANJI.test(ja) ? !readingFits(ja, kana) : ja !== kana) continue
    if (seen.has(ja)) continue
    seen.add(ja)
    out.push({ ja, reading: kana, fr: w.fr, group: groupOf(ja, kana) })
  }
  return out
}
