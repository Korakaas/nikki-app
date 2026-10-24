import type { ReactNode } from 'react'

/*
  Autocollants dessinés à la main (SVG 48×48), contour à l'encre du cahier.
  Ajouter un autocollant = ajouter une entrée ici.
*/
const S = { stroke: 'var(--ink)', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

export const STICKERS: { kind: string; label: string; art: ReactNode }[] = [
  {
    kind: 'star',
    label: 'étoile',
    art: <polygon {...S} fill="#f6d55c" points="24,4 29.5,17.5 44,18.5 33,28 36.5,42 24,34.5 11.5,42 15,28 4,18.5 18.5,17.5" />,
  },
  {
    kind: 'heart',
    label: 'cœur',
    art: <path {...S} fill="#ef8a8a" d="M24 41 C8 29 5 21 8 14 C11 8 19 8 24 15 C29 8 37 8 40 14 C43 21 40 29 24 41 Z" />,
  },
  {
    kind: 'sun',
    label: 'soleil',
    art: (
      <>
        <g {...S} fill="none">
          <path d="M24 3v7M24 38v7M3 24h7M38 24h7M9 9l5 5M34 34l5 5M39 9l-5 5M14 34l-5 5" />
        </g>
        <circle {...S} cx="24" cy="24" r="9" fill="#f6c453" />
      </>
    ),
  },
  {
    kind: 'cloud',
    label: 'nuage',
    art: <path {...S} fill="#cfe3f3" d="M14 36 C7 36 5 28 11 26 C11 18 21 14 26 20 C32 15 41 20 38 28 C44 29 43 36 36 36 Z" />,
  },
  {
    kind: 'sakura',
    label: 'sakura',
    art: (
      <>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} {...S} cx="24" cy="12.5" rx="6.5" ry="9" fill="#f7c3d2" transform={`rotate(${a} 24 24)`} />
        ))}
        <circle {...S} cx="24" cy="24" r="4" fill="#f6d55c" />
      </>
    ),
  },
  {
    kind: 'onigiri',
    label: 'onigiri',
    art: (
      <>
        <path {...S} fill="#fffdf6" d="M24 7 L42 38 Q42 41 39 41 L9 41 Q6 41 6 38 Z" />
        <rect {...S} x="16" y="30" width="16" height="11" fill="#33463a" />
      </>
    ),
  },
  {
    kind: 'tea',
    label: 'thé',
    art: (
      <>
        <path {...S} fill="none" d="M18 5 C15 9 21 11 18 15M27 5 C24 9 30 11 27 15" />
        <path {...S} fill="#bfe0c9" d="M9 20 H35 V28 C35 35 30 40 22 40 C14 40 9 35 9 28 Z" />
        <path {...S} fill="none" d="M35 22 H39 C43 22 43 31 35 31" />
      </>
    ),
  },
  {
    kind: 'moon',
    label: 'lune',
    art: <path {...S} fill="#f5d36b" d="M30 6 A18 18 0 1 0 42 32 A14 14 0 0 1 30 6 Z" />,
  },
  {
    kind: 'umbrella',
    label: 'parapluie',
    art: (
      <>
        <path {...S} fill="#9bb7e8" d="M5 26 C5 14 14 7 24 7 C34 7 43 14 43 26 C40 23 37 23 34 26 C31 23 27 23 24 26 C21 23 17 23 14 26 C11 23 8 23 5 26 Z" />
        <path {...S} fill="none" d="M24 26 V38 C24 43 18 43 18 38" />
      </>
    ),
  },
  {
    kind: 'leaf',
    label: 'feuille',
    art: (
      <>
        <path {...S} fill="#c8e0a3" d="M10 38 C8 18 22 8 40 8 C40 26 32 40 14 38 Z" />
        <path {...S} fill="none" d="M10 38 L30 18" />
      </>
    ),
  },
  {
    kind: 'note',
    label: 'musique',
    art: (
      <>
        <path {...S} fill="none" d="M20 34 V10 L36 7 V30" />
        <ellipse {...S} cx="15.5" cy="34" rx="5.5" ry="4" fill="#d7c4ec" />
        <ellipse {...S} cx="31.5" cy="30" rx="5.5" ry="4" fill="#d7c4ec" />
      </>
    ),
  },
  {
    kind: 'book',
    label: 'livre',
    art: (
      <>
        <rect {...S} x="9" y="7" width="30" height="35" rx="3" fill="#f2b98b" />
        <path {...S} fill="none" d="M15 7 V42M21 16H33M21 22H33" />
      </>
    ),
  },
]

export function StickerArt({ kind, size = 44 }: { kind: string; size?: number }) {
  const found = STICKERS.find((s) => s.kind === kind)
  if (!found) return null
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role="img" aria-label={found.label}>
      {found.art}
    </svg>
  )
}
