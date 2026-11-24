import { useId } from 'react'
import type { StampKind } from '../types'

export type AnyStamp = StampKind | 'nibun'

const LABEL: Record<AnyStamp, string> = {
  ganbari: 'がんばりました',
  yoku: 'よくできました',
  hanamaru: '花丸',
  nibun: '二分 できた',
}

/**
 * Tampon de professeur : rouge encre, un peu de travers, un peu irrégulier et transparent.
 * Posé sans bruit ni notification (S18.19). Décoratif : le texte caché le décrit.
 */
export default function Stamp({ kind, size = 84, tilt = -8, className = '' }: { kind: AnyStamp; size?: number; tilt?: number; className?: string }) {
  const fid = useId().replace(/:/g, '')
  const petals = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    return { cx: 50 + 26 * Math.cos(a), cy: 50 + 26 * Math.sin(a) }
  })
  return (
    <span className={`stamp stamp-${kind} ${className}`.trim()} style={{ width: size, height: size, transform: `rotate(${tilt}deg)` }} role="img" aria-label={`Tampon : ${LABEL[kind]}`}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" focusable="false">
        <defs>
          <filter id={fid} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
          </filter>
        </defs>
        <g filter={`url(#${fid})`} fill="none" stroke="currentColor" strokeLinecap="round">
          {(kind === 'ganbari' || kind === 'yoku') && (
            <>
              <circle cx="50" cy="50" r="46" strokeWidth="4.5" />
              <circle cx="50" cy="50" r="38" strokeWidth="1.6" />
              {kind === 'ganbari' ? (
                <g fill="currentColor" stroke="none" fontFamily="inherit" fontWeight="700" textAnchor="middle">
                  <text x="50" y="45" fontSize="15">がんば</text>
                  <text x="50" y="64" fontSize="15">りました</text>
                </g>
              ) : (
                <g fill="currentColor" stroke="none" fontFamily="inherit" fontWeight="700" textAnchor="middle">
                  <text x="50" y="44" fontSize="14">よく</text>
                  <text x="50" y="63" fontSize="13">できました</text>
                </g>
              )}
            </>
          )}
          {kind === 'hanamaru' && (
            <>
              {petals.map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r="17" strokeWidth="3" />
              ))}
              <path d="M50 50 m-1 0 a3 3 0 1 1 4 3 a7 7 0 1 1 -9 -8 a11 11 0 1 1 13 13" strokeWidth="3" />
            </>
          )}
          {kind === 'nibun' && (
            <>
              <rect x="6" y="6" width="88" height="88" rx="9" strokeWidth="5" />
              <rect x="14" y="14" width="72" height="72" rx="5" strokeWidth="1.6" />
              <g fill="currentColor" stroke="none" fontFamily="inherit" fontWeight="800" textAnchor="middle">
                <text x="50" y="58" fontSize="34">二分</text>
                <text x="50" y="77" fontSize="11" fontWeight="600">できた</text>
              </g>
            </>
          )}
        </g>
      </svg>
    </span>
  )
}
