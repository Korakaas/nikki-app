import { Pill, type Role } from './Block'

/** État de la correction, vu depuis la rangée des trois étapes. */
export type FixState =
  | { kind: 'empty' }
  | { kind: 'ready' }
  | { kind: 'busy' }
  | { kind: 'pending' }
  | { kind: 'done'; errors: number; stale: boolean }

interface Props {
  /** Un thème est déjà choisi pour ce jour. */
  hasTheme: boolean
  isToday: boolean
  /** Nombre de caractères écrits. */
  chars: number
  fix: FixState
  onTheme: () => void
  onEntry: () => void
  onFix: () => void
}

function fixLabel(fix: FixState): string {
  switch (fix.kind) {
    case 'empty':
      return 'après ton texte'
    case 'ready':
      return 'prête'
    case 'busy':
      return 'en cours…'
    case 'pending':
      return 'en attente'
    case 'done':
      if (fix.stale) return 'texte modifié'
      return fix.errors === 0 ? 'aucune erreur' : fix.errors === 1 ? '1 erreur' : `${fix.errors} erreurs`
  }
}

/**
 * Les trois étapes du jour (S1.3) : thème, entrée, correction, en un tap sous la semaine.
 * Chaque bouton dit où on en est et mène à l'étape ; aucun ne lance la correction.
 */
export default function Pillars({ hasTheme, isToday, chars, fix, onTheme, onEntry, onFix }: Props) {
  const fixOff = fix.kind === 'empty' || fix.kind === 'busy' || fix.kind === 'pending'
  const fixNow = fix.kind === 'done' && !fix.stale
  const items: { role: Role; ja: string; title: string; state: string; now?: boolean; soft?: boolean; ready?: boolean; off?: boolean; go: () => void }[] = [
    { role: 'write', ja: '題', title: 'Thème', state: hasTheme ? (isToday ? 'du jour' : 'de ce jour') : 'choisir', go: onTheme },
    { role: 'write', ja: '書', title: 'Entrée', state: `${chars} 文字`, now: !fixNow, go: onEntry },
    {
      role: 'fix',
      ja: '添',
      title: 'Correction',
      state: fixLabel(fix),
      now: fixNow,
      soft: fix.kind === 'empty',
      ready: fix.kind === 'ready' || fix.kind === 'done',
      off: fixOff,
      go: onFix,
    },
  ]
  return (
    <ul className="pillars" aria-label="Les trois étapes du jour">
      {items.map((it) => (
        <li key={it.ja}>
          <button
            type="button"
            className={`pillar${it.now ? ' now' : ''}${it.soft ? ' soft' : ''}${it.ready ? ' ready' : ''}`}
            disabled={it.off}
            // Garde le clavier ouvert au toucher, comme la barre du bas.
            onMouseDown={(e) => e.preventDefault()}
            onClick={it.go}
          >
            <Pill role={it.role}>{it.ja}</Pill>
            <b>{it.title}</b>
            <small>{it.state}</small>
          </button>
        </li>
      ))}
    </ul>
  )
}
