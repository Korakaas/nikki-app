export type ChevronDir = 'left' | 'right' | 'down'

const PATHS: Record<ChevronDir, string> = {
  left: 'M15 4.5 8 12l7.2 7.4',
  right: 'M9 4.5 16 12l-7.2 7.4',
  down: 'M4.5 9 12 16l7.4-7.2',
}

/** Petit chevron tracé à main levée. */
export default function Chevron({ dir, size = 26 }: { dir: ChevronDir; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[dir]} />
    </svg>
  )
}
