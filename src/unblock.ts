import { callTool } from './aiTool'
import { CorrectionFailure, levelLine, obj, str } from './api'
import { plainText } from './furigana'
import type { Settings } from './types'

/** Une aide pour sortir du blocage : une question en français, puis un début de phrase en japonais. */
export interface Unblock {
  question: string
  starter: string
  /** Ce que veut dire l'amorce, en français. */
  gloss: string
}

const TOOL_NAME = 'submit_unblock'

const TOOL = {
  name: TOOL_NAME,
  description: 'Rend une question guidée et une amorce de phrase.',
  input_schema: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description:
          "Une seule question en français (12 mots au plus), douce et concrète, qui aide à trouver quoi dire : une chose vécue aujourd'hui, un détail, un ressenti. Pas de japonais.",
      },
      starter: {
        type: 'string',
        description:
          "Un début de phrase en japonais (sans point final, 25 caractères au plus), simple et naturel, qui répond à la question et que l'apprenant(e) peut continuer. Écris les kanji tels quels, sans furigana.",
      },
      gloss: {
        type: 'string',
        description: "Ce que veut dire l'amorce, en français, avec « … » à la fin (12 mots au plus).",
      },
    },
    required: ['question', 'starter'],
  },
}

function system(level: string): string {
  return `Tu aides un(e) francophone qui tient un journal en japonais et qui bloque devant la page.

${levelLine(level)}

On te donne le sujet du jour (s'il y en a un) et ce que la personne a déjà écrit (parfois rien). Ne juge rien, ne corrige rien, n'évalue rien. Pose UNE question guidée en français, simple et bienveillante, qui aide à trouver quoi dire. Donne aussi UNE amorce : un début de phrase en japonais, qui répond à la question, et que la personne peut continuer toute seule. Ne répète pas ce qui est déjà écrit.

Réponds uniquement en appelant l'outil ${TOOL_NAME}.`
}

/** Demande une question guidée et une amorce en un seul appel (la seconde étape est locale). */
export async function requestUnblock(
  settings: Settings,
  context: { topic?: string; text: string },
): Promise<Unblock> {
  const text = context.text.trim()
  const parts = [
    context.topic ? `Sujet du jour : ${context.topic}` : 'Pas de sujet imposé.',
    text ? `Déjà écrit (fin de l'entrée) :\n${text.slice(-300)}` : "Rien d'écrit pour l'instant.",
  ]
  const raw = obj(await callTool(settings, TOOL, system(settings.targetLevel), parts.join('\n'), 250))
  const question = str(raw.question)
  const starter = plainText(str(raw.starter)).replace(/[。.]+$/, '')
  if (!question || !starter) throw new CorrectionFailure('format', 'La réponse est incomplète.')
  return { question, starter, gloss: str(raw.gloss) }
}
