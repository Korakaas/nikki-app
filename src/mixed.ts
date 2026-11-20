/** Les quatre sortes d'exercices mélangés dans « J'ai 2 minutes ». */
export type MixedKind = 'errors' | 'particle' | 'transitivity' | 'conjugation'

export const MIXED_SIZE = 5

/**
 * L'ordre des questions d'une série : réparties entre les types disponibles, mélangées,
 * sans jamais deux questions du même type de suite quand c'est possible.
 */
export function planMixed(
  available: MixedKind[],
  size = MIXED_SIZE,
  rand: () => number = Math.random,
): MixedKind[] {
  if (available.length === 0) return []
  if (available.length === 1) return Array<MixedKind>(size).fill(available[0])
  // Répartition la plus égale possible ; les types en trop sont tirés au hasard.
  const order = [...available].sort(() => rand() - 0.5)
  const counts = new Map<MixedKind, number>()
  for (let i = 0; i < size; i++) {
    const k = order[i % order.length]
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const plan: MixedKind[] = []
  while (plan.length < size) {
    const last = plan[plan.length - 1]
    const left = [...counts].filter(([, n]) => n > 0)
    const options = left.filter(([k]) => k !== last)
    const pool = options.length > 0 ? options : left
    // Le type qui en a le plus à placer passe en premier : on évite de finir sur une répétition.
    pool.sort((a, b) => b[1] - a[1] || rand() - 0.5)
    const top = pool.filter((p) => p[1] === pool[0][1])
    const [kind] = top[Math.floor(rand() * top.length)]
    plan.push(kind)
    counts.set(kind, (counts.get(kind) ?? 1) - 1)
  }
  return plan
}

/**
 * Remplit la série : pour chaque place du plan, la prochaine question du type voulu ;
 * si ce type n'a plus de question, on prend dans un autre.
 */
export function fillPlan<T extends { kind: MixedKind }>(plan: MixedKind[], pools: Record<MixedKind, T[]>): T[] {
  const left: Record<MixedKind, T[]> = {
    errors: [...pools.errors],
    particle: [...pools.particle],
    transitivity: [...pools.transitivity],
    conjugation: [...pools.conjugation],
  }
  const out: T[] = []
  for (const kind of plan) {
    const from = left[kind].length > 0 ? kind : (Object.keys(left) as MixedKind[]).find((k) => left[k].length > 0)
    if (!from) break
    out.push(left[from].shift()!)
  }
  return out
}
