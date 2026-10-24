import { activeLibrary } from './anki'
import { arr, CorrectionFailure, obj, postApi, str } from './api'
import { addDays, countChars } from './format'
import { plainText } from './furigana'
import { GRAMMAR } from './prompts/data'
import { goodPoints, timesUsed } from './stats'
import type { AnkiLibrary, Entry, Settings, WeeklyReview } from './types'

const TOOL_NAME = 'submit_review'

const TOOL = {
  name: TOOL_NAME,
  description: 'Rend le bilan de la semaine.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          'Bilan général en français, 2 à 4 phrases, chaleureux mais exact. Pas de liste.',
      },
      recurring: {
        type: 'array',
        description:
          'Erreurs qui REVIENNENT (au moins deux fois cette semaine, ou déjà vues avant), 0 à 4. Vide si rien ne revient vraiment.',
        items: {
          type: 'object',
          properties: {
            point: { type: 'string', description: 'Nom court en français. Ex. « に ou で pour le lieu ».' },
            explanation: { type: 'string', description: 'La règle à retenir, en français, 1 à 2 phrases.' },
            wrong: { type: 'string', description: 'Une phrase fautive prise dans ses entrées, telle qu’écrite, sans balisage.' },
            right: { type: 'string', description: 'La même phrase corrigée, kanji balisés {漢字|かんじ}.' },
          },
          required: ['point', 'explanation', 'wrong', 'right'],
        },
      },
      progress: {
        type: 'array',
        description:
          'Ce qui progresse ou ce qui est bien maîtrisé, en français, 0 à 3 phrases courtes, appuyées sur des faits des entrées.',
        items: { type: 'string' },
      },
      focus: {
        type: 'object',
        description: 'Un seul point de grammaire à viser la semaine suivante.',
        properties: {
          pattern: { type: 'string', description: 'Le point, ex. 〜ために. Pris dans la liste proposée si possible.' },
          fr: { type: 'string', description: 'Son sens, en français, court.' },
          level: { type: 'string', enum: ['N4', 'N3', 'N2'] },
          why: { type: 'string', description: 'Pourquoi celui-là pour cette personne, en français, 1 à 2 phrases.' },
          example: { type: 'string', description: 'Une phrase d’exemple courte, kanji balisés {漢字|かんじ}.' },
          example_fr: { type: 'string', description: 'Traduction française de l’exemple.' },
        },
        required: ['pattern', 'fr', 'level', 'why', 'example', 'example_fr'],
      },
    },
    required: ['summary', 'recurring', 'progress', 'focus'],
  },
}

const SYSTEM = `Tu es le professeur de japonais d'un(e) apprenant(e) francophone qui tient un petit journal en japonais. Tu lui fais le bilan de sa semaine à partir de ses entrées et de leurs corrections.

Règles :
- Appuie-toi UNIQUEMENT sur ce qui figure dans les données. N'invente ni erreur, ni progrès. S'il y a peu de données, dis-le simplement.
- Une erreur « qui revient » apparaît plusieurs fois (cette semaine ou dans la période précédente fournie pour comparaison). Une faute isolée n'en est pas une.
- Un progrès doit être constaté : moins d'erreurs d'un type que la période précédente, un point de grammaire réussi, des phrases plus longues ou plus variées. Si rien ne le montre, laisse la liste vide.
- Le point à viser doit répondre à un besoin réel vu dans les entrées (une confusion, un point à revoir) ou, à défaut, être un point utile du niveau visé qu'elle n'a pas encore réussi à placer. Choisis-le dans la liste de candidats quand c'est possible.
- Écris en français ; seules les phrases d'exemple sont en japonais, au niveau JLPT de l'apprenant(e).
- Dans les champs « right » et « example », balise CHAQUE groupe de kanji : {漢字|かんじ}. Dans « wrong », recopie la phrase telle quelle, sans balisage.

Réponds uniquement en appelant l'outil ${TOOL_NAME}.`


interface Window {
  from: string
  to: string
  entries: Entry[]
}

function between(entries: Entry[], from: string, to: string): Entry[] {
  return entries
    .filter((e) => e.id >= from && e.id <= to && e.text.trim() !== '')
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** La semaine à relire : les 7 derniers jours, aujourd'hui compris. */
export function reviewWindow(entries: Entry[], today: string): Window {
  const from = addDays(today, -6)
  return { from, to: today, entries: between(entries, from, today) }
}

function summarize(entries: Entry[]) {
  const kinds = new Map<string, number>()
  let chars = 0
  let errors = 0
  const examples: string[] = []
  for (const e of entries) {
    if (!e.correction) continue
    chars += countChars(e.correction.sourceText)
    for (const item of e.correction.errors) {
      errors++
      kinds.set(item.kind, (kinds.get(item.kind) ?? 0) + 1)
      if (examples.length < 12) examples.push(`${item.original} → ${plainText(item.corrected)} (${item.kind})`)
    }
  }
  return { kinds, chars, errors, examples }
}

function describeEntries(entries: Entry[]): string {
  return entries
    .map((e) => {
      const lines = [`### ${e.id}`, e.text.trim()]
      if (e.correction) {
        if (e.correction.errors.length === 0) lines.push('Corrigée : aucune erreur.')
        else {
          lines.push('Erreurs relevées :')
          for (const item of e.correction.errors) {
            lines.push(
              `- [${item.kind}] ${item.original} → ${plainText(item.corrected)} : ${plainText(item.explanation)}`,
            )
          }
        }
        if (e.correction.grammarGood.length)
          lines.push(`Bien employés : ${e.correction.grammarGood.map((g) => plainText(g.point)).join('、')}`)
        if (e.correction.grammarReview.length)
          lines.push(`À revoir : ${e.correction.grammarReview.map((g) => plainText(g.point)).join('、')}`)
      } else {
        lines.push('(pas encore corrigée)')
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

function describePrevious(entries: Entry[]): string {
  const s = summarize(entries)
  if (s.chars === 0) return 'Aucune entrée corrigée sur la période précédente.'
  const kinds = [...s.kinds].map(([k, n]) => `${k} ${n}`).join(', ') || 'aucune erreur'
  return [
    `${entries.length} entrées, ${s.chars} caractères, ${s.errors} erreurs (${((s.errors / s.chars) * 100).toFixed(1)} pour 100 caractères).`,
    `Par type : ${kinds}.`,
    s.examples.length ? `Exemples :\n${s.examples.map((x) => `- ${x}`).join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Points de grammaire proposés comme candidats : du niveau visé, pas encore bien placés. */
export function focusCandidates(
  entries: Entry[],
  library: AnkiLibrary | null,
  level: Settings['targetLevel'],
): { pattern: string; fr: string }[] {
  const good = goodPoints(entries)
  const wanted = level === 'N2' ? ['N3', 'N2'] : level === 'N3' ? ['N4', 'N3'] : ['N4']
  const pool = [
    ...activeLibrary(library).grammar,
    ...GRAMMAR.filter((g) => wanted.includes(g.level)),
  ]
  const seen = new Set<string>()
  const out: { pattern: string; fr: string }[] = []
  for (const g of pool) {
    if (seen.has(g.pattern) || timesUsed(g.pattern, good) > 0) continue
    seen.add(g.pattern)
    out.push({ pattern: g.pattern, fr: g.fr })
  }
  return out.slice(0, 60)
}

export function normalizeReview(input: unknown, win: Window, settings: Settings): WeeklyReview {
  const raw = obj(input)
  const focus = obj(raw.focus)
  const pattern = str(focus.pattern)
  if (!pattern) throw new CorrectionFailure('format', 'La réponse est incomplète.')
  const level = str(focus.level)
  return {
    createdAt: Date.now(),
    from: win.from,
    to: win.to,
    entryCount: win.entries.length,
    model: settings.model,
    summary: str(raw.summary),
    recurring: arr(raw.recurring)
      .map(obj)
      .map((r) => ({
        point: str(r.point),
        explanation: str(r.explanation),
        wrong: str(r.wrong),
        right: str(r.right),
      }))
      .filter((r) => r.point && r.explanation)
      .slice(0, 4),
    progress: arr(raw.progress)
      .map(str)
      .filter(Boolean)
      .slice(0, 3),
    focus: {
      pattern,
      fr: str(focus.fr),
      level: level === 'N4' || level === 'N3' || level === 'N2' ? level : settings.targetLevel,
      why: str(focus.why),
      example: str(focus.example),
      exampleFr: str(focus.example_fr),
    },
  }
}

/** Demande à Claude le bilan de la semaine (sans toucher aux entrées). */
export async function requestReview(
  all: Entry[],
  library: AnkiLibrary | null,
  settings: Settings,
  today: string,
): Promise<WeeklyReview> {
  const win = reviewWindow(all, today)
  if (win.entries.length === 0) {
    throw new CorrectionFailure('other', 'Écris au moins une entrée cette semaine pour faire le bilan.')
  }
  const previous = between(all, addDays(today, -27), addDays(today, -7))
  const candidates = focusCandidates(all, library, settings.targetLevel)
  const content = [
    `Niveau visé : JLPT ${settings.targetLevel}.`,
    `Semaine à relire : du ${win.from} au ${win.to} (${win.entries.length} entrée(s)).`,
    '',
    describeEntries(win.entries),
    '',
    `## Période précédente (${addDays(today, -27)} → ${addDays(today, -7)}), pour comparer`,
    describePrevious(previous),
    '',
    '## Candidats pour le point à viser (pas encore bien placés)',
    candidates.length
      ? candidates.map((c) => `- ${c.pattern} : ${c.fr}`).join('\n')
      : '(aucun : propose un point utile du niveau visé)',
  ].join('\n')

  const body = (retry: boolean) => ({
    model: settings.model,
    max_tokens: 3000,
    system:
      SYSTEM +
      (retry ? `\n\nIMPORTANT : ta réponse précédente n'appelait pas l'outil. Appelle maintenant ${TOOL_NAME}, sans autre texte.` : ''),
    tools: [TOOL],
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content }],
  })
  const find = (r: Awaited<ReturnType<typeof postApi>>) =>
    r.content?.find((b) => b.type === 'tool_use' && b.name === TOOL_NAME)
  let block = find(await postApi(settings, body(false)))
  if (!block) block = find(await postApi(settings, body(true)))
  if (!block) throw new CorrectionFailure('format', "La réponse n'a pas le bon format. Réessaie.")
  return normalizeReview(block.input, win, settings)
}

