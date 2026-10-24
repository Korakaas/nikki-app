import type { AnkiDeckInfo, AnkiGrammar, AnkiLibrary, AnkiWord } from './types'

/*
  Lecture des exports Anki « Notes en texte brut (.txt) ».
  Le fichier commence par des lignes d'en-tête (#separator:tab, #deck column:1, …),
  puis une note par ligne, les champs étant séparés par une tabulation. Les champs qui
  contiennent des tabulations, des retours à la ligne ou des guillemets sont entre guillemets.
*/

const SEPARATORS: Record<string, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
  pipe: '|',
  colon: ':',
  space: ' ',
}

export interface TsvFile {
  meta: Record<string, string>
  rows: string[][]
}

export function parseTsv(input: string): TsvFile {
  let text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const meta: Record<string, string> = {}
  let i = 0
  while (text[i] === '#') {
    let end = text.indexOf('\n', i)
    if (end < 0) end = text.length
    const m = /^#([^:]+):(.*)$/.exec(text.slice(i, end).replace(/\r$/, ''))
    if (m) meta[m[1].trim()] = m[2].trim()
    i = end + 1
  }
  text = text.slice(i)

  const sep = SEPARATORS[meta.separator ?? 'tab'] ?? '\t'
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let pos = 0
  const n = text.length

  const endRow = () => {
    row.push(field)
    field = ''
    if (row.length > 1 || row[0] !== '') rows.push(row)
    row = []
  }

  while (pos < n) {
    const ch = text[pos]
    if (ch === '"' && field === '') {
      // Champ entre guillemets : "" désigne un guillemet.
      pos++
      while (pos < n) {
        if (text[pos] === '"') {
          if (text[pos + 1] === '"') {
            field += '"'
            pos += 2
            continue
          }
          pos++
          break
        }
        field += text[pos++]
      }
      continue
    }
    if (ch === sep) {
      row.push(field)
      field = ''
      pos++
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[pos + 1] === '\n') pos++
      pos++
      endRow()
    } else {
      field += ch
      pos++
    }
  }
  if (field !== '' || row.length > 0) endRow()
  return { meta, rows }
}

// ---------------------------------------------------------------- nettoyage

const ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
}

function stripTags(s: string): string {
  return s
    .replace(/<\s*(br|\/div|\/p|\/li|\/tr|\/h\d)\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
}

/** HTML d'une carte -> lignes de texte brut. */
function plainLines(html: string): string[] {
  // Deux passes : certains champs contiennent des balises échappées (&lt;br&gt;).
  const decoded = stripTags(html.replace(/\[sound:[^\]]*\]/g, '')).replace(
    /&(#?\w+);/g,
    (m, e: string) => ENTITIES[e] ?? m,
  )
  return stripTags(decoded)
    .split('\n')
    .map((s) => s.replace(/[\s\u00a0\u202f]+/g, ' ').trim())
    .filter(Boolean)
}

const JA = '\\u3000-\\u30ff\\u4e00-\\u9fff\\uff00-\\uffef'
const SPACE_BETWEEN_JA = new RegExp(`(?<=[${JA}]) +(?=[${JA}])`, 'g')
const HAS_HAN = /[一-鿿々]/
const HAS_JA = new RegExp(`[${JA}]`)

/** Retire la numérotation « 1. » et les espaces entre mots japonais. */
function cleanSentence(s: string): string {
  return s.replace(/^\d+[.．)）]\s*/, '').replace(SPACE_BETWEEN_JA, '').trim()
}

/** Part de caractères japonais dans un texte (0 à 1). */
function japaneseShare(s: string): number {
  const chars = Array.from(s.replace(/\s/g, ''))
  if (chars.length === 0) return 0
  const ja = new RegExp(`[${JA}]`)
  return chars.filter((c) => ja.test(c)).length / chars.length
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const stop = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf(' ; '))
  return (stop > 20 ? cut.slice(0, stop) : cut).trim() + '…'
}

// ---------------------------------------------------------------- extraction

const GRAMMAR_LEVEL = (deck: string): AnkiGrammar['level'] => {
  const m = /N([1-5])/.exec(deck)
  return m && m[1] !== '5' ? (`N${m[1]}` as AnkiGrammar['level']) : 'N3'
}

/** Notetype « GRAM N3 » : Expression, Signification, Explication, PhraseJaponaise, TraductionPhrase, …, image. */
function grammarFrom(f: string[], deck: string): AnkiGrammar | null {
  const pattern = (plainLines(f[0] ?? '')[0] ?? '')
    .replace(/[.。]$/, '')
    .replace(/[~～]/g, '〜')
    .trim()
  // Plusieurs sens numérotés (« 1. avant que 2. pendant que ») : on les met bout à bout.
  const fr = plainLines(f[1] ?? '')
    .map((l) => l.replace(/^\d+[.．)）]\s*/, ''))
    .join(' ; ')
  if (!pattern || !fr || !HAS_JA.test(pattern)) return null

  let sentences = plainLines(f[3] ?? '')
  // Certaines cartes n'ont l'exemple que dans le champ « image » (texte après la photo).
  if (sentences.length === 0) sentences = plainLines(f[8] ?? '').filter((s) => HAS_JA.test(s))
  const translations = plainLines(f[4] ?? '')
  const example = cleanSentence(sentences[0] ?? '')
  const exampleFr = japaneseShare(translations[0] ?? '') > 0.5 ? '' : (translations[0] ?? '')

  return {
    deck,
    pattern,
    fr: truncate(fr, 110),
    level: GRAMMAR_LEVEL(deck),
    example,
    exampleFr: truncate(exampleFr, 140),
  }
}

/** Deck « JLPT N3 » : mot[lecture;repères] · phrase · traduction · sens (<p>mot (lecture) ★</p><p>∙ sens</p>) */
function wordFromKotoba(f: string[]): AnkiWord | null {
  // « {(}が{)}凍る » : on garde le mot, sans l'indication de transitivité (が)/(を).
  const raw = stripTags(f[0] ?? '')
    .replace(/\s+/g, '')
    .replace(/[{}]/g, '')
    .replace(/^[(（][がをにで][)）]/, '')
  if (!raw) return null
  const ja = raw.replace(/\[[^\]]*\]/g, '')
  let sawBracket = false
  // « base[lecture,variante;repères] » devient sa lecture ; une lecture vide garde la base (déjà en kana).
  let reading = raw.replace(
    /([^[\]]+?)\[([^\];]*)(?:;[^\]]*)?\]/g,
    (_m, base: string, r: string) => {
      sawBracket = true
      return r.split(',')[0] || base
    },
  )
  if (!sawBracket || !HAS_HAN.test(ja)) reading = ''
  const gloss = plainLines(f[3] ?? '')
    .map((l) => l.replace(/^∙\s*/, ''))
    .filter((l) => l && !l.includes('★') && !/^\S+ \(.+\)$/.test(l))
  const fr = truncate(gloss.join(', '), 70)
  if (!ja || !fr) return null
  return { deck: '', ja, reading, fr }
}

/** Deck « JLPT Tango » : id · expression · lecture[furigana Anki] · sens français · … */
function wordFromTango(f: string[]): AnkiWord | null {
  const ja = (plainLines(f[1] ?? '')[0] ?? '').replace(/\s+/g, '')
  const fr = truncate(plainLines(f[3] ?? '').join(', '), 70)
  if (!ja || !fr) return null
  const readingRaw = plainLines(f[2] ?? '')[0] ?? ''
  let reading = ''
  if (/\[[^\]]+\]/.test(readingRaw)) {
    reading = readingRaw
      .replace(/ ?([^ >[\]]+?)\[([^\]]+)\]/g, '$2')
      .replace(/\s+/g, '')
  }
  if (!HAS_HAN.test(ja)) reading = ''
  return { deck: '', ja, reading, fr }
}

// ---------------------------------------------------------------- import

export interface ParsedExport {
  grammar: AnkiGrammar[]
  words: AnkiWord[]
  /** Notes qu'on a volontairement laissées de côté (cartes de discrimination…). */
  skipped: number
  /** Notes qu'on n'a pas su lire. */
  unknown: number
}

export function parseAnkiExport(text: string): ParsedExport {
  const { meta, rows } = parseTsv(text)
  const column = (name: string) => {
    const v = Number(meta[`${name} column`])
    return Number.isInteger(v) && v > 0 ? v : 0
  }
  const deckCol = column('deck')
  const metaCols = new Set(
    ['deck', 'tags', 'notetype', 'guid'].map(column).filter((c) => c > 0),
  )

  const out: ParsedExport = { grammar: [], words: [], skipped: 0, unknown: 0 }
  for (const row of rows) {
    const deck = deckCol ? (row[deckCol - 1] ?? '') : 'Import Anki'
    const f = row.filter((_, idx) => !metaCols.has(idx + 1))

    if (/discrimination/i.test(deck)) {
      out.skipped++
      continue
    }

    let grammar: AnkiGrammar | null = null
    let word: AnkiWord | null = null
    if (/^JLPT_Tango/i.test(f[0] ?? '') && f.length >= 4) {
      word = wordFromTango(f)
    } else if (f.length >= 7 && /\[sound:/.test((f[5] ?? '') + (f[6] ?? ''))) {
      word = wordFromKotoba(f)
    } else if (f.length >= 5) {
      grammar = grammarFrom(f, deck)
    }

    if (grammar) out.grammar.push(grammar)
    else if (word) out.words.push({ ...word, deck })
    else out.unknown++
  }
  return out
}

// ---------------------------------------------------------------- bibliothèque

export function emptyLibrary(): AnkiLibrary {
  return { importedAt: 0, decks: [], grammar: [], words: [] }
}

/** Fusionne un export : les notes des decks présents dans le fichier remplacent les anciennes. */
export function mergeExport(lib: AnkiLibrary, parsed: ParsedExport): AnkiLibrary {
  const incoming = new Map<string, { kind: AnkiDeckInfo['kind']; count: number }>()
  for (const g of parsed.grammar) {
    const d = incoming.get(g.deck) ?? { kind: 'grammar' as const, count: 0 }
    d.count++
    incoming.set(g.deck, d)
  }
  const seen = new Set<string>()
  const words: AnkiWord[] = []
  for (const w of parsed.words) {
    if (seen.has(w.ja)) continue // les doublons entre sous-decks ne servent à rien
    seen.add(w.ja)
    words.push(w)
    const d = incoming.get(w.deck) ?? { kind: 'vocab' as const, count: 0 }
    d.count++
    incoming.set(w.deck, d)
  }

  const replaced = new Set(incoming.keys())
  const decks: AnkiDeckInfo[] = lib.decks.filter((d) => !replaced.has(d.name))
  for (const [name, d] of incoming) {
    const before = lib.decks.find((x) => x.name === name)
    decks.push({ name, kind: d.kind, count: d.count, enabled: before?.enabled ?? true })
  }
  decks.sort((a, b) => a.name.localeCompare(b.name))

  return {
    importedAt: Date.now(),
    decks,
    grammar: [...lib.grammar.filter((g) => !replaced.has(g.deck)), ...parsed.grammar],
    words: [...lib.words.filter((w) => !replaced.has(w.deck)), ...words],
  }
}

/** Ce qui peut être proposé : seulement les decks cochés. */
export function activeLibrary(lib: AnkiLibrary | null | undefined) {
  if (!lib) return { grammar: [] as AnkiGrammar[], words: [] as AnkiWord[] }
  const on = new Set(lib.decks.filter((d) => d.enabled).map((d) => d.name))
  return {
    grammar: lib.grammar.filter((g) => on.has(g.deck)),
    words: lib.words.filter((w) => on.has(w.deck)),
  }
}

/** Clé de comparaison de deux points de grammaire (« 〜うちに » = « うちに »). */
export function patternKey(pattern: string): string {
  return pattern.replace(/[～〜~\s()（）・／/…\[\]]/g, '')
}
