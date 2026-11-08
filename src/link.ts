import { CorrectionFailure, levelLine, obj, postApi, str } from './api'
import { plainText } from './furigana'
import type { DailyPrompt, PromptLink, Settings } from './types'

const TOOL_NAME = 'submit_link'

const TOOL = {
  name: TOOL_NAME,
  description: "Rend la phrase d'exemple qui relie le sujet, le point de grammaire et les mots.",
  input_schema: {
    type: 'object',
    properties: {
      ja: {
        type: 'string',
        description:
          "Une phrase d'exemple naturelle de journal intime, sur le sujet, qui emploie le point de grammaire ET au moins un des mots proposés (de préférence deux). Tous les kanji balisés {漢字|かんじ}.",
      },
      fr: { type: 'string', description: 'Traduction française de la phrase.' },
      tip: {
        type: 'string',
        description:
          "Un conseil en français, 1 à 2 phrases : comment placer ce point de grammaire dans ce sujet, avec une piste concrète de ce qu'on peut raconter.",
      },
    },
    required: ['ja', 'fr', 'tip'],
  },
}

function system(level: string): string {
  return `Tu aides un(e) francophone qui tient un journal en japonais.

${levelLine(level)}

On te donne le sujet du jour, un point de grammaire et des mots. Écris UNE phrase d'exemple de journal intime, à la première personne, simple et naturelle, qui traite du sujet en employant le point de grammaire et au moins un des mots (de préférence deux). Les mots doivent y être à leur place, pas plaqués. Ne reprends pas la phrase d'exemple du point de grammaire. Baliser TOUS les kanji de la phrase : {漢字|かんじ}.

Réponds uniquement en appelant l'outil ${TOOL_NAME}.`
}

function content(prompt: DailyPrompt): string {
  const words = prompt.words.map((w) => `${plainText(w.ja)}${w.reading ? `（${w.reading}）` : ''} = ${w.fr}`)
  return [
    `Sujet : ${plainText(prompt.topic.ja)} (${prompt.topic.fr})`,
    `Point de grammaire : ${prompt.grammar.pattern} (${prompt.grammar.fr})`,
    `Mots : ${words.join(' ; ')}`,
  ].join('\n')
}

/** Demande à Claude une phrase qui relie le sujet, la grammaire et les mots du jour. */
export async function requestLink(prompt: DailyPrompt, settings: Settings): Promise<PromptLink> {
  const body = (retry: boolean) => ({
    model: settings.model,
    max_tokens: 800,
    system:
      system(settings.targetLevel) +
      (retry ? `\n\nIMPORTANT : ta réponse précédente n'appelait pas l'outil. Appelle maintenant ${TOOL_NAME}, sans autre texte.` : ''),
    tools: [TOOL],
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: content(prompt) }],
  })
  const find = (r: Awaited<ReturnType<typeof postApi>>) =>
    r.content?.find((b) => b.type === 'tool_use' && b.name === TOOL_NAME)
  let block = find(await postApi(settings, body(false)))
  if (!block) block = find(await postApi(settings, body(true)))
  if (!block) throw new CorrectionFailure('format', "La réponse n'a pas le bon format.")
  const raw = obj(block.input)
  const link = { ja: str(raw.ja), fr: str(raw.fr), tip: str(raw.tip) }
  if (!link.ja) throw new CorrectionFailure('format', 'La réponse est incomplète.')
  return link
}
