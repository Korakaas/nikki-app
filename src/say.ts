import { callTool } from './aiTool'
import { CorrectionFailure, arr, levelLine, obj, str } from './api'
import { plainText } from './furigana'
import { difficultyOf, type Difficulty, type Settings } from './types'

/** Une façon de dire une phrase française en japonais. */
export interface Formulation {
  /** Japonais avec le balisage de furigana {漢字|かんじ}. */
  ja: string
  reading: string
  /** Niveau approximatif et registre, par exemple « N4 · poli ». */
  level: string
}

const TOOL_NAME = 'submit_phrases'
export const MAX_SAY_CHARS = 200

const TOOL = {
  name: TOOL_NAME,
  description: 'Rend une à trois façons de dire la phrase en japonais.',
  input_schema: {
    type: 'object',
    properties: {
      phrases: {
        type: 'array',
        minItems: 1,
        maxItems: 3,
        description: 'Une à trois formulations naturelles, de la plus simple à la plus soutenue.',
        items: {
          type: 'object',
          properties: {
            ja: {
              type: 'string',
              description:
                'La phrase en japonais naturel. Balise chaque kanji avec sa lecture : {今日|きょう}は{雨|あめ}です。',
            },
            reading: { type: 'string', description: 'La phrase entière en hiragana.' },
            level: {
              type: 'string',
              description: "Niveau JLPT approximatif puis registre, séparés par « · » : par exemple « N4 · poli », « N3 · plus soutenu », « N5 · familier ».",
            },
          },
          required: ['ja', 'reading', 'level'],
        },
      },
    },
    required: ['phrases'],
  },
}

function system(level: Difficulty): string {
  return `Tu aides un(e) francophone qui tient un journal en japonais.

${levelLine(level)}

On te donne une phrase ou une expression en français : donne UNE à TROIS façons naturelles de la dire en japonais, de la plus simple à la plus soutenue. Les formulations doivent vraiment différer (niveau ou registre) ; n'en invente pas une troisième si deux suffisent. Pas d'explication, pas de commentaire.

Réponds uniquement en appelant l'outil ${TOOL_NAME}.`
}

/** Demande à Claude comment dire une phrase française en japonais. */
export async function requestSay(settings: Settings, french: string): Promise<Formulation[]> {
  const raw = obj(
    await callTool(settings, TOOL, system(difficultyOf(settings)), french.trim().slice(0, MAX_SAY_CHARS), 600),
  )
  const out: Formulation[] = []
  for (const item of arr(raw.phrases).slice(0, 3)) {
    const o = obj(item)
    const ja = str(o.ja)
    if (!ja || !plainText(ja).trim()) continue
    out.push({ ja, reading: str(o.reading), level: str(o.level) })
  }
  if (out.length === 0) throw new CorrectionFailure('format', 'La réponse est incomplète.')
  return out
}
