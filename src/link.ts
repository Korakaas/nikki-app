import { CorrectionFailure, levelLine, obj, postApi, str } from './api'
import { plainText } from './furigana'
import { difficultyOf, type DailyPrompt, type Difficulty, type PromptLink, type Settings } from './types'

const TOOL_NAME = 'submit_link'

const TOOL = {
  name: TOOL_NAME,
  description: 'Rend le défi de traduction du jour.',
  input_schema: {
    type: 'object',
    properties: {
      challenge: {
        type: 'string',
        description:
          "Un défi de traduction : UNE phrase française (10 à 25 mots), à la première personne, sur le sujet du jour, dont la traduction naturelle en japonais emploie le point de grammaire et au moins un des mots. Pas de japonais dedans.",
      },
      bridge: {
        type: 'string',
        description:
          "Le pont : une courte phrase en français (70 caractères au plus) qui montre comment placer le point de grammaire et un mot dans ce sujet. Vide si fits est faux. Pas de japonais.",
      },
      fits: {
        type: 'boolean',
        description:
          "Vrai si le point de grammaire et les mots s'emploient naturellement dans ce sujet ; faux s'il faudrait forcer le lien.",
      },
    },
    required: ['challenge'],
  },
}

function system(level: Difficulty, themeOnly = false): string {
  if (themeOnly) {
    return `Tu aides un(e) francophone qui tient un journal en japonais.

${levelLine(level)}

On te donne le sujet du jour. Écris un défi de traduction : UNE phrase française, à la première personne, simple et naturelle, sur le sujet, que l'apprenant(e) traduira en japonais pour commencer son entrée. Aucune contrainte de grammaire ni de mots. Ne donne ni la traduction ni aucun japonais.

Réponds uniquement en appelant l'outil ${TOOL_NAME}.`
  }
  return `Tu aides un(e) francophone qui tient un journal en japonais.

${levelLine(level)}

On te donne le sujet du jour, un point de grammaire et des mots. Écris un défi de traduction : UNE phrase française, à la première personne, simple et naturelle, sur le sujet, que l'apprenant(e) traduira en japonais pour commencer son entrée. Sa traduction naturelle doit employer le point de grammaire et au moins un des mots (de préférence deux), à leur place, pas plaqués. Ne donne ni la traduction ni aucun japonais.

Écris aussi le « pont » : une courte phrase en français (70 caractères au plus) qui montre comment placer le point de grammaire et un mot dans ce sujet, par exemple la situation où ils s'emploient naturellement. Si aucun lien naturel n'est possible entre le sujet et le point ou les mots, mets fits à faux et laisse le pont vide : il vaut mieux changer de sujet que forcer le lien.

Réponds uniquement en appelant l'outil ${TOOL_NAME}.`
}

function content(prompt: DailyPrompt): string {
  if (prompt.themeOnly) return `Sujet : ${plainText(prompt.topic.ja)} (${prompt.topic.fr})\nPas de point de grammaire ni de mots imposés : phrase libre sur le sujet.`
  const words = prompt.words.map((w) => `${plainText(w.ja)}${w.reading ? `（${w.reading}）` : ''} = ${w.fr}`)
  return [
    `Sujet : ${plainText(prompt.topic.ja)} (${prompt.topic.fr})`,
    `Point de grammaire : ${prompt.grammar.pattern} (${prompt.grammar.fr})`,
    `Mots : ${words.join(' ; ')}`,
  ].join('\n')
}

/** Demande à Claude un défi de traduction qui relie le sujet, la grammaire et les mots du jour. */
export async function requestLink(prompt: DailyPrompt, settings: Settings): Promise<PromptLink> {
  const light = settings.lightModel?.trim()
  // Modèle léger d'abord (bien moins cher) ; s'il échoue, le modèle principal prend le relais.
  if (light && light !== settings.model) {
    try {
      return await requestLinkWith(prompt, settings, light)
    } catch {
      // on retente avec le modèle principal
    }
  }
  return requestLinkWith(prompt, settings, settings.model)
}

async function requestLinkWith(prompt: DailyPrompt, settings: Settings, model: string): Promise<PromptLink> {
  const body = (retry: boolean) => ({
    model,
    max_tokens: 300,
    system:
      system(difficultyOf(settings), prompt.themeOnly) +
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
  const challenge = str(raw.challenge)
  if (!challenge) throw new CorrectionFailure('format', 'La réponse est incomplète.')
  if (prompt.themeOnly) return { challenge }
  const fits = raw.fits === false ? false : true
  // Trop long pour tenir sur deux lignes : on n'affiche pas de pont plutôt que de le couper.
  const bridge = str(raw.bridge).length <= 100 ? str(raw.bridge) : ''
  return fits && bridge ? { challenge, bridge, fits } : { challenge, fits }
}
