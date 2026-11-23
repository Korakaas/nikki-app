import { callTool, type ChatMessage } from './aiTool'
import { CorrectionFailure, arr, levelLine, obj, str } from './api'
import { plainText } from './furigana'
import type { Correction, Settings, ThreadTurn } from './types'

export const MAX_QUESTION_CHARS = 300

const TOOL_NAME = 'submit_answer'

const TOOL = {
  name: TOOL_NAME,
  description: 'Rend la réponse à la question sur la correction.',
  input_schema: {
    type: 'object',
    properties: {
      answer: {
        type: 'string',
        description:
          "La réponse en français : directe, bienveillante, 120 mots au plus, sans titre ni liste. Pas d'exemple japonais ici (ils vont dans examples) ; un mot ou une courte expression japonaise cités dans le texte restent permis.",
      },
      examples: {
        type: 'array',
        maxItems: 3,
        description: 'De zéro à trois exemples japonais courts et naturels.',
        items: {
          type: 'object',
          properties: {
            ja: {
              type: 'string',
              description: 'La phrase japonaise. Balise chaque kanji avec sa lecture : {今日|きょう}は{雨|あめ}です。',
            },
            fr: { type: 'string', description: 'Son sens en français.' },
          },
          required: ['ja', 'fr'],
        },
      },
    },
    required: ['answer'],
  },
}

function system(level: string): string {
  return `Tu es un professeur de japonais bienveillant. Un(e) apprenant(e) francophone qui tient un journal en japonais te pose une question sur la correction de son entrée.

${levelLine(level)}

Réponds en français, directement à la question, en t'appuyant sur son entrée et sur la faute concernée si elle est indiquée. Commence par ce qui est juste dans son intention si c'est pertinent, jamais de reproche. Ne reviens pas sur la ponctuation ni sur les fautes de frappe. Donne au plus trois exemples japonais courts, de niveau adapté, avec leur sens.

Réponds uniquement en appelant l'outil ${TOOL_NAME}.`
}

/** Tout ce que Claude doit savoir de la correction (entrée, fautes, grammaire). */
export function correctionContext(c: Correction): string {
  const errors = c.errors.map(
    (e, i) =>
      `${i + 1}. [${e.kind}] ${plainText(e.original)} → ${plainText(e.corrected)}${e.explanation ? ` — ${plainText(e.explanation)}` : ''}`,
  )
  const grammar = [
    ...c.grammarGood.map((g) => `○ ${plainText(g.point)}`),
    ...c.grammarReview.map((g) => `△ ${plainText(g.point)}`),
  ]
  return [
    `Entrée de l'apprenant(e) :\n${c.sourceText.trim()}`,
    c.natural ? `Version plus naturelle proposée :\n${plainText(c.natural)}` : '',
    errors.length > 0 ? `Fautes corrigées :\n${errors.join('\n')}` : 'Aucune faute corrigée.',
    grammar.length > 0 ? `Grammaire :\n${grammar.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function asText(t: ThreadTurn): string {
  const ex = t.examples.map((x) => `${plainText(x.ja)} (${x.fr})`).join('\n')
  return ex ? `${t.a}\n${ex}` : t.a
}

/** Les messages à envoyer : le contexte avec la première question, puis chaque échange déjà fait. */
export function buildMessages(correction: Correction, history: ThreadTurn[], question: string, about?: string): ChatMessage[] {
  const q = (text: string, a?: string) => (a ? `À propos de la faute « ${a} » : ${text}` : text)
  const turns = [...history.map((t) => ({ q: t.q, about: t.about, a: asText(t) })), { q: question, about, a: '' }]
  const out: ChatMessage[] = []
  turns.forEach((t, i) => {
    const first = i === 0 ? `${correctionContext(correction)}\n\nQuestion : ` : ''
    out.push({ role: 'user', content: first + q(t.q, t.about) })
    if (t.a) out.push({ role: 'assistant', content: t.a })
  })
  return out
}

/** Pose une question sur une correction ; rend la réponse et ses exemples. */
export async function requestAnswer(
  settings: Settings,
  correction: Correction,
  history: ThreadTurn[],
  question: string,
  about?: string,
): Promise<Pick<ThreadTurn, 'a' | 'examples'>> {
  const raw = obj(
    await callTool(
      settings,
      TOOL,
      system(settings.targetLevel),
      buildMessages(correction, history, question.trim().slice(0, MAX_QUESTION_CHARS), about),
      900,
    ),
  )
  const a = str(raw.answer)
  if (!a) throw new CorrectionFailure('format', 'La réponse est incomplète.')
  const examples = arr(raw.examples)
    .slice(0, 3)
    .map((x) => ({ ja: str(obj(x).ja), fr: str(obj(x).fr) }))
    .filter((x) => x.ja && plainText(x.ja).trim())
  return { a, examples }
}
