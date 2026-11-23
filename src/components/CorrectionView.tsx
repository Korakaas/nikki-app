import { useState } from 'react'
import { Jp, plainText } from '../furigana'
import Chevron from './Chevron'
import CorrectionThread from './CorrectionThread'
import type { Correction, CorrectionItem, FuriganaFrom, Settings } from '../types'

interface Props {
  correction: Correction
  furigana: FuriganaFrom
  /** Le texte a changé depuis cette correction. */
  stale?: boolean
  /** Ouvert au départ (par défaut : replié, un tap sur le titre le déplie). */
  startOpen?: boolean
  /** Pour poser des questions sur la correction (S10) : l'entrée, les réglages (clé, plafond). */
  entryId?: string
  settings?: Settings
  onOpenSettings?: () => void
}

/** Une faute a-t-elle des explications à déplier ? */
function hasDetails(e: CorrectionItem): boolean {
  return Boolean(e.explanation || e.context || e.otherUse)
}

export default function CorrectionView({ correction, furigana, stale, startOpen, entryId, settings, onOpenSettings }: Props) {
  const { summary, praise, natural, errors, grammarGood, grammarReview } = correction
  const [open, setOpen] = useState(Boolean(startOpen))
  // Fautes dont les explications sont dépliées (repliées au départ).
  const [opened, setOpened] = useState<Set<number>>(new Set())
  // Fil de questions : ouvert ou non, et faute concernée par la prochaine question.
  const [threadOpen, setThreadOpen] = useState(false)
  const [about, setAbout] = useState<string | null>(null)
  const canAsk = Boolean(entryId && settings?.apiKey)
  const foldable = errors.map((e, i) => (hasDetails(e) ? i : -1)).filter((i) => i >= 0)
  const allOpen = foldable.length > 0 && foldable.every((i) => opened.has(i))
  const toggleFault = (i: number) =>
    setOpened((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
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

      {praise && (
        <p className="praise fr" lang="fr">
          <Jp text={praise} furigana={furigana} />
        </p>
      )}

      {!open && <p className="fr tensaku-overview">{overview}</p>}
      {open && (
        <>

      {stale && (
        <p className="stale" lang="fr">
          Le texte a changé depuis cette correction.
        </p>
      )}

      {summary && !praise && (
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

      <h3 className="part part-row">
        <span>まちがい</span>
        <span className="fr">Erreurs</span>
        {foldable.length > 0 && (
          <button
            type="button"
            className="fold-all fr"
            onClick={() => setOpened(allOpen ? new Set() : new Set(foldable))}
          >
            {allOpen ? 'Tout replier' : 'Tout déplier'}
          </button>
        )}
      </h3>
      {errors.length === 0 ? (
        <p className="green-ink">まちがいは見つかりませんでした。</p>
      ) : (
        <ul className="fixes">
          {errors.map((e, i) => (
            <li key={i} className="fix">
              {hasDetails(e) ? (
                <button
                  type="button"
                  className="fix-head"
                  aria-expanded={opened.has(i)}
                  onClick={() => toggleFault(i)}
                >
                  <span className="fix-main">
                    <span className="fix-kind fr">{e.kind}</span>
                    <span className="fix-line">
                      <del className="fix-original">{plainText(e.original)}</del>
                      <span className="fix-arrow" aria-hidden="true">
                        →
                      </span>
                      <span className="red-ink fix-corrected">
                        <Jp text={e.corrected} furigana={furigana} />
                      </span>
                    </span>
                  </span>
                  <span className="fold-icon">
                    <Chevron dir={opened.has(i) ? 'down' : 'right'} size={20} />
                  </span>
                </button>
              ) : (
                <div className="fix-head fix-head-plain">
                  <span className="fix-main">
                    <span className="fix-kind fr">{e.kind}</span>
                    <span className="fix-line">
                      <del className="fix-original">{plainText(e.original)}</del>
                      <span className="fix-arrow" aria-hidden="true">
                        →
                      </span>
                      <span className="red-ink fix-corrected">
                        <Jp text={e.corrected} furigana={furigana} />
                      </span>
                    </span>
                  </span>
                </div>
              )}
              {opened.has(i) && (
                <div className="fix-details">
                  {e.explanation && (
                    <FixPart label="Pourquoi c’est faux" text={e.explanation} furigana={furigana} />
                  )}
                  {e.context && (
                    <FixPart label="Dans quel contexte c’est impossible" text={e.context} furigana={furigana} />
                  )}
                  {e.otherUse && (
                    <FixPart label="Dans quel autre cas l’employer" text={e.otherUse} furigana={furigana} />
                  )}
                  {canAsk && (
                    <button
                      type="button"
                      className="link fix-ask fr"
                      onClick={() => {
                        setAbout(`${plainText(e.original)} → ${plainText(e.corrected)}`)
                        setThreadOpen(true)
                      }}
                    >
                      Une question sur cette faute ?
                    </button>
                  )}
                </div>
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

      {entryId && settings && (
        <CorrectionThread
          key={correction.createdAt}
          entryId={entryId}
          correction={correction}
          settings={settings}
          furigana={furigana}
          open={threadOpen}
          onOpen={() => setThreadOpen(true)}
          onClose={() => {
            setThreadOpen(false)
            setAbout(null)
          }}
          about={about}
          onClearAbout={() => setAbout(null)}
          onOpenSettings={onOpenSettings}
        />
      )}
        </>
      )}
    </section>
  )
}

function FixPart({ label, text, furigana }: { label: string; text: string; furigana: FuriganaFrom }) {
  return (
    <div className="fix-part">
      <p className="fix-part-label fr">{label}</p>
      <p className="fix-why">
        <Jp text={text} furigana={furigana} />
      </p>
    </div>
  )
}
