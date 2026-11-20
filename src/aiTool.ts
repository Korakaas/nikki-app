import { CorrectionFailure, postApi } from './api'
import type { Settings } from './types'

interface ToolDef {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

/**
 * Un appel à un outil Claude, avec le modèle léger d'abord (bien moins cher) puis le modèle
 * principal s'il échoue. Une seule nouvelle tentative si la réponse n'appelle pas l'outil.
 * Rend l'entrée brute de l'outil ; chaque appel est compté dans le mois (voir postApi).
 */
export async function callTool(
  settings: Settings,
  tool: ToolDef,
  system: string,
  userContent: string,
  maxTokens: number,
): Promise<unknown> {
  const light = settings.lightModel?.trim()
  if (light && light !== settings.model) {
    try {
      return await callWith(settings, light, tool, system, userContent, maxTokens)
    } catch {
      // on retente avec le modèle principal
    }
  }
  return callWith(settings, settings.model, tool, system, userContent, maxTokens)
}

async function callWith(
  settings: Settings,
  model: string,
  tool: ToolDef,
  system: string,
  userContent: string,
  maxTokens: number,
): Promise<unknown> {
  const body = (retry: boolean) => ({
    model,
    max_tokens: maxTokens,
    system:
      system +
      (retry ? `\n\nIMPORTANT : ta réponse précédente n'appelait pas l'outil. Appelle maintenant ${tool.name}, sans autre texte.` : ''),
    tools: [tool],
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: userContent }],
  })
  const find = (r: Awaited<ReturnType<typeof postApi>>) =>
    r.content?.find((b) => b.type === 'tool_use' && b.name === tool.name)
  let block = find(await postApi(settings, body(false)))
  if (!block) block = find(await postApi(settings, body(true)))
  if (!block) throw new CorrectionFailure('format', "La réponse n'a pas le bon format.")
  return block.input
}
