import { plainText } from './furigana'
import {
  ERROR_KINDS,
  type Correction,
  type CorrectionItem,
  type ErrorKind,
  type GrammarGood,
  type GrammarReview,
  type DailyPrompt,
  type Settings,
} from './types'

export type FailureCode =
  | 'no-key'
  | 'auth'
  | 'rate'
  | 'network'
  | 'server'
  | 'format'
  | 'other'

/** Échec de correction avec un message déjà prêt à afficher. */
export class CorrectionFailure extends Error {
  readonly code: FailureCode
  constructor(code: FailureCode, message: string) {
    super(message)
    this.code = code
  }
}

const TOOL_NAME = 'submit_correction'

const TOOL = {
  name: TOOL_NAME,
  description:
    "Envoie la correction de l'entrée de journal. À appeler une seule fois, avec tous les champs.",
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          'Un commentaire de 1 à 2 phrases en japonais simple : ce qui est bien, et le point principal à travailler.',
      },
      natural: {
        type: 'string',
        description:
          "Le texte complet réécrit comme l'écrirait un Japonais, en gardant le sens et le ton de l'apprenant.",
      },
      errors: {
        type: 'array',
        description:
          'Les fautes et maladresses, les plus importantes d’abord. Vide si le texte est correct.',
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ERROR_KINDS },
            original: {
              type: 'string',
              description:
                "Le passage fautif, recopié exactement comme écrit par l'apprenant, sans balisage.",
            },
            corrected: { type: 'string', description: 'Le passage corrigé.' },
            explanation: {
              type: 'string',
              description: "Pourquoi, en 1 à 2 phrases de japonais simple.",
            },
          },
          required: ['kind', 'original', 'corrected', 'explanation'],
        },
      },
      grammar_good: {
        type: 'array',
        description:
          'Points de grammaire N4/N3 bien utilisés dans le texte (0 à 3).',
        items: {
          type: 'object',
          properties: {
            point: { type: 'string', description: 'Ex. 〜ので' },
            note: {
              type: 'string',
              description: 'Une courte remarque en japonais simple.',
            },
          },
          required: ['point', 'note'],
        },
      },
      grammar_review: {
        type: 'array',
        description:
          'Points de grammaire N4/N3 à retravailler d’après les fautes (0 à 2).',
        items: {
          type: 'object',
          properties: {
            point: { type: 'string' },
            note: {
              type: 'string',
              description: 'La règle en une ou deux phrases de japonais simple.',
            },
            example: {
              type: 'string',
              description: 'Une phrase d’exemple courte et correcte.',
            },
          },
          required: ['point', 'note', 'example'],
        },
      },
    },
    required: ['summary', 'natural', 'errors', 'grammar_good', 'grammar_review'],
  },
}

function systemPrompt(level: string): string {
  return `Tu es un professeur de japonais qui corrige l'entrée de journal d'un(e) apprenant(e) francophone.

Niveau de l'apprenant(e) : JLPT ${level} (prépare le N3 en partant du N4). Écris tout le japonais de ta réponse à ce niveau : vocabulaire et grammaire N4–N3, phrases courtes. Aucun français dans les champs.

Principes de correction :
- Garde le sens, la voix et le registre de l'apprenant(e). Ne réécris pas ce qui est correct.
- Corrige les vraies fautes (particules, conjugaisons, vocabulaire, orthographe) et signale les tournures grammaticalement justes mais peu naturelles (kind = "naturel"), sans exagérer.
- Regroupe les fautes qui se répètent en un seul élément. Maximum 6 éléments, les plus utiles d'abord.
- « original » recopie le passage fautif tel quel (court, quelques mots). « corrected » donne le passage corrigé.
- Si le texte est déjà correct, laisse « errors » vide et dis-le dans « summary ».
- La version « natural » reste au niveau ${level} autant que possible.
- Sois honnête : ne félicite pas ce qui est faux, ne cherche pas de défauts là où il n'y en a pas.
- Si le texte n'est pas principalement en japonais, laisse « errors » vide, écris dans « natural » une version japonaise simple du sens, et dis-le dans « summary ».

Furigana : dans TOUS les textes japonais que tu écris (summary, natural, corrected, explanation, point, note, example), balise CHAQUE groupe de kanji, sans exception, même les plus simples (人, 私, 何, 日, 今, 使, 言, 前…) : {kanji|lecture en hiragana}. L'application masque elle-même les lectures trop faciles selon son réglage, donc ne décide pas à sa place. Exemples : 食べる s'écrit {食|た}べる ; 面白かった s'écrit {面白|おもしろ}かった ; 今日 s'écrit {今日|きょう} ; 大丈夫 s'écrit {大丈夫|だいじょうぶ} ; 私たちは s'écrit {私|わたし}たちは. Les okurigana et les mots sans kanji restent hors des accolades. Avant de répondre, relis chaque champ pour vérifier qu'aucun kanji n'est resté sans balise. N'utilise PAS de balisage dans le champ « original ».

Point de grammaire visé : quand le message indique un « point de grammaire visé », l'apprenant(e) essayait de l'employer. Commente-le dans grammar_good (bien employé) ou grammar_review (à revoir, avec un exemple). S'il est absent du texte, ajoute-le à grammar_review avec une note disant simplement qu'il n'apparaît pas encore, et ne le compte pas comme une faute. Ne signale jamais l'absence des mots de vocabulaire proposés ; s'ils sont bien utilisés, tu peux le dire dans summary.

Réponds uniquement en appelant l'outil ${TOOL_NAME}.`
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

function normalize(input: unknown, text: string, model: string): Correction {
  const raw = obj(input)
  const errors: CorrectionItem[] = arr(raw.errors)
    .map(obj)
    .map((e) => ({
      kind: (ERROR_KINDS as string[]).includes(str(e.kind))
        ? (str(e.kind) as ErrorKind)
        : 'grammaire',
      original: str(e.original),
      corrected: str(e.corrected),
      explanation: str(e.explanation),
    }))
    .filter((e) => e.original && e.corrected)
    .slice(0, 8)
  const grammarGood: GrammarGood[] = arr(raw.grammar_good)
    .map(obj)
    .map((g) => ({ point: str(g.point), note: str(g.note) }))
    .filter((g) => g.point)
    .slice(0, 4)
  const grammarReview: GrammarReview[] = arr(raw.grammar_review)
    .map(obj)
    .map((g) => ({
      point: str(g.point),
      note: str(g.note),
      example: str(g.example),
    }))
    .filter((g) => g.point)
    .slice(0, 3)
  const natural = str(raw.natural)
  if (!natural) throw new CorrectionFailure('format', 'La réponse est incomplète.')
  return {
    sourceText: text,
    summary: str(raw.summary),
    natural,
    errors,
    grammarGood,
    grammarReview,
    model,
    createdAt: Date.now(),
  }
}

async function readApiMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    return body.error?.message ?? ''
  } catch {
    return ''
  }
}

interface ApiResponse {
  content?: { type: string; name?: string; input?: unknown }[]
}

/** Un appel à l'API. Les échecs sont convertis en messages lisibles. */
function userMessage(text: string, prompt?: DailyPrompt | null): string {
  if (!prompt) return `Voici mon entrée de journal :\n\n${text}`
  const words = prompt.words.map((w) => (w.reading ? `${w.ja}（${w.reading}）` : w.ja)).join('、')
  return [
    `Sujet proposé : ${plainText(prompt.topic.ja)}`,
    `Point de grammaire visé : ${prompt.grammar.pattern} (${prompt.grammar.fr})`,
    `Mots proposés : ${words}`,
    '',
    `Voici mon entrée de journal :\n\n${text}`,
  ].join('\n')
}

async function callApi(
  text: string,
  settings: Settings,
  retry: boolean,
  prompt?: DailyPrompt | null,
): Promise<ApiResponse> {
  if (!settings.apiKey) {
    throw new CorrectionFailure(
      'no-key',
      'Ajoute ta clé API dans les réglages pour corriger.',
    )
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 90_000)

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        // Obligatoire pour appeler l'API depuis un navigateur.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 4096,
        system:
          systemPrompt(settings.targetLevel) +
          (retry
            ? `\n\nIMPORTANT : ta réponse précédente n'appelait pas l'outil. Appelle maintenant l'outil ${TOOL_NAME}, sans autre texte.`
            : ''),
        tools: [TOOL],
        // Certains modèles refusent qu'on impose l'outil : on laisse le choix
        // au modèle et on relance une fois s'il répond par du texte.
        tool_choice: { type: 'auto' },
        messages: [
          { role: 'user', content: userMessage(text, prompt) },
        ],
      }),
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new CorrectionFailure(
        'network',
        'La correction a pris trop de temps. Réessaie.',
      )
    }
    throw new CorrectionFailure(
      'network',
      'Impossible de joindre le serveur. Vérifie ta connexion.',
    )
  } finally {
    window.clearTimeout(timeout)
  }

  if (!res.ok) {
    const detail = await readApiMessage(res)
    if (res.status === 401 || res.status === 403) {
      throw new CorrectionFailure(
        'auth',
        'Clé API refusée. Vérifie-la dans les réglages.',
      )
    }
    if (res.status === 404) {
      throw new CorrectionFailure(
        'other',
        `Modèle introuvable (« ${settings.model} »). Vérifie son nom dans les réglages.`,
      )
    }
    if (res.status === 429) {
      throw new CorrectionFailure(
        'rate',
        'Trop de demandes (ou crédit épuisé). Réessaie dans une minute.',
      )
    }
    if (res.status >= 500) {
      throw new CorrectionFailure(
        'server',
        'Le service est surchargé. Réessaie dans un instant.',
      )
    }
    throw new CorrectionFailure(
      'other',
      detail ? `Erreur : ${detail}` : `Erreur ${res.status}.`,
    )
  }

  return (await res.json()) as ApiResponse
}

function findCorrection(data: ApiResponse) {
  return data.content?.find((b) => b.type === 'tool_use' && b.name === TOOL_NAME)
}

/** Demande la correction d'un texte à l'API Claude, directement depuis le téléphone. */
export async function requestCorrection(
  text: string,
  settings: Settings,
  prompt?: DailyPrompt | null,
): Promise<Correction> {
  let block = findCorrection(await callApi(text, settings, false, prompt))
  if (!block) block = findCorrection(await callApi(text, settings, true, prompt))
  if (!block) {
    throw new CorrectionFailure('format', "La réponse n'a pas le bon format. Réessaie.")
  }
  return normalize(block.input, text, settings.model)
}
