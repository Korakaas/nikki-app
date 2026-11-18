import type { UsageCounter, UsageLog } from './db'

/** Tarifs en dollars par million de jetons (entrée, sortie), pour des requêtes de moins de 100 000 jetons. */
export function pricesFor(model: string): { input: number; output: number } {
  if (/haiku/i.test(model)) return { input: 0.1, output: 0.5 }
  // Sonnet 5.5, et par défaut pour un modèle qu'on ne connaît pas.
  return { input: 2, output: 10 }
}

export const KIND_LABEL: Record<string, string> = {
  correction: 'corrections',
  review: 'bilans',
  link: 'phrases d’exemple',
  autre: 'autres',
}

export interface MonthUsage {
  month: string
  calls: number
  input: number
  output: number
  /** Dollars, d'après le tarif indicatif. */
  cost: number
  byKind: [string, UsageCounter][]
}

export function costOf(input: number, output: number, model = ''): number {
  const p = pricesFor(model)
  return (input / 1_000_000) * p.input + (output / 1_000_000) * p.output
}

export function monthUsage(log: UsageLog, month: string): MonthUsage {
  const slot = log[month] ?? {}
  let calls = 0
  let input = 0
  let output = 0
  let cost = 0
  for (const c of Object.values(slot)) {
    calls += c.calls
    input += c.input
    output += c.output
    cost += c.cost ?? costOf(c.input, c.output)
  }
  return {
    month,
    calls,
    input,
    output,
    cost,
    byKind: Object.entries(slot).sort((a, b) => b[1].calls - a[1].calls),
  }
}

export function monthId(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function previousMonthId(d = new Date()): string {
  return monthId(new Date(d.getFullYear(), d.getMonth() - 1, 1))
}

export function formatCost(dollars: number): string {
  if (dollars === 0) return '0 $'
  if (dollars < 0.01) return '< 0,01 $'
  return `${dollars.toFixed(2).replace('.', ',')} $`
}
