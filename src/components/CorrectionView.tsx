import { useState } from 'react'
import { Jp, plainText } from '../furigana'
import Chevron from './Chevron'
import type { Correction, FuriganaFrom } from '../types'

interface Props {
  correction: Correction
  furigana: FuriganaFrom
  /** Le texte a changé depuis cette correction. */
  stale?: boolean
  /** Ouvert au départ (par défaut : replié, un tap sur le titre le déplie). */
  startOpen?: boolean
}

export default function CorrectionView({ correction, furigana, stale, startOpen }: Props) {
  const { summary, natural, errors, grammarGood, grammarReview } = correction
  const [open, setOpen] = useState(Boolean(startOpen))
  const overview = `${errors.length === 0 ? 'aucune erreur' : errors.length === 1 ? '1 erreur' : `${errors.length} erreurs`}${
    grammarGood.length + grammarReview.length > 0
      ? ` · ${grammarGood.length} ○ ${grammarReview.length} △`
      : ''
  }`

  return (
    <section className="tensaku" lang="ja" aria-label="Correction">
      <h2 className="tensaku-title">
        <button
          type="button"
          className="fold"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="red-ink">添削</span>
          <span className="fr">Correction</span>
          <span className="fold-icon">
            <Chevron dir={open ? 'down' : 'right'} size={22} />
          </span>
        </button>
      </h2>

      {!open && <p className="fr tensaku-overview">{overview}</p>}
      {open && (
        <>

      {stale && (
        <p className="stale" lang="fr">
          Le texte a changé depuis cette correction.
        </p>
      )}

      {summary && (
        <p className="teacher-note green-ink">
          <Jp text={summary} furigana={furigana} />
        </p>
      )}

      <h3 className="part">
        <span>もっと自然に</span>
        <span className="fr">Version plus naturelle</span>
      </h3>
      <p className="natural blue-ink">
        <Jp text={natural} furigana={furigana} />
      </p>

      <h3 className="part">
        <span>まちがい</span>
        <span className="fr">Erreurs</span>
      </h3>
      {errors.length === 0 ? (
        <p className="green-ink">まちがいは見つかりませんでした。</p>
      ) : (
        <ul className="fixes">
          {errors.map((e, i) => (
            <li key={i} className="fix">
              <p className="fix-kind fr">{e.kind}</p>
              <p className="fix-line">
                <del className="fix-original">{plainText(e.original)}</del>
                <span className="fix-arrow" aria-hidden="true">
                  →
                </span>
                <span className="red-ink fix-corrected">
                  <Jp text={e.corrected} furigana={furigana} />
                </span>
              </p>
              {e.explanation && (
                <p className="fix-why">
                  <Jp text={e.explanation} furigana={furigana} />
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {(grammarGood.length > 0 || grammarReview.length > 0) && (
        <>
          <h3 className="part">
            <span>文法</span>
            <span className="fr">Grammaire</span>
          </h3>
          <ul className="grammar">
            {grammarGood.map((g, i) => (
              <li key={`g${i}`} className="grammar-item">
                <span className="mark green-ink" aria-label="bien utilisé">
                  ○
                </span>
                <div>
                  <p className="grammar-point">
                    <Jp text={g.point} furigana={furigana} />
                  </p>
                  {g.note && (
                    <p className="grammar-note">
                      <Jp text={g.note} furigana={furigana} />
                    </p>
                  )}
                </div>
              </li>
            ))}
            {grammarReview.map((g, i) => (
              <li key={`r${i}`} className="grammar-item">
                <span className="mark red-ink" aria-label="à revoir">
                  △
                </span>
                <div>
                  <p className="grammar-point">
                    <Jp text={g.point} furigana={furigana} />
                  </p>
                  {g.note && (
                    <p className="grammar-note">
                      <Jp text={g.note} furigana={furigana} />
                    </p>
                  )}
                  {g.example && (
                    <p className="grammar-example blue-ink">
                      <Jp text={g.example} furigana={furigana} />
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
        </>
      )}
    </section>
  )
}
