import { useEffect, useMemo, useState } from 'react'
import Block from './Block'
import Chevron from './Chevron'
import { CorrectionFailure } from '../api'
import { addReview, loadReviews } from '../db'
import { Jp } from '../furigana'
import CopyForClaude from './CopyForClaude'
import { requestReview, reviewWindow } from '../review'
import type { AnkiLibrary, Entry, FuriganaFrom, Settings, WeeklyReview } from '../types'

interface Props {
  entries: Entry[]
  library: AnkiLibrary | null
  settings: Settings
  today: string
}

function shortDate(id: string): string {
  const [, m, d] = id.split('-')
  return `${Number(d)}/${Number(m)}`
}

function ReviewView({ review, furigana }: { review: WeeklyReview; furigana: FuriganaFrom }) {
  const { focus } = review
  return (
    <div className="review">
      <p className="review-range fr">
        Du {shortDate(review.from)} au {shortDate(review.to)} · {review.entryCount} entrée
        {review.entryCount > 1 ? 's' : ''}
      </p>
      {review.summary && <p className="review-text">{review.summary}</p>}

      {review.progress.length > 0 && (
        <>
          <h3 className="sub fr">Ça progresse</h3>
          <ul className="review-list">
            {review.progress.map((p, i) => (
              <li key={i}>
                <p className="review-text">
                  <span className="mark green-ink">○</span> {p}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {review.recurring.length > 0 && (
        <>
          <h3 className="sub fr">Ce qui revient</h3>
          <ul className="review-list">
            {review.recurring.map((r, i) => (
              <li key={i}>
                <p className="review-text review-point">
                  <span className="mark red-ink">△</span> {r.point}
                </p>
                <p className="review-text">{r.explanation}</p>
                {r.wrong && r.right && (
                  <p className="fix-line" lang="ja">
                    <del className="fix-original">{r.wrong}</del>
                    <span className="fix-arrow" aria-hidden="true">
                      →
                    </span>
                    <span className="red-ink">
                      <Jp text={r.right} furigana={furigana} />
                    </span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="sub fr">À viser la semaine prochaine</h3>
      <div className="review-focus">
        <p className="review-pattern" lang="ja">
          {focus.pattern}
          <span className="fr"> · {focus.level}</span>
        </p>
        <p className="review-text">{focus.fr}</p>
        {focus.why && <p className="review-text review-why">{focus.why}</p>}
        {focus.example && (
          <p className="note-example" lang="ja">
            <Jp text={focus.example} furigana={furigana} />
          </p>
        )}
        {focus.exampleFr && <p className="fr">{focus.exampleFr}</p>}
      </div>
    </div>
  )
}

/** Bilan de la semaine : Claude relit les entrées récentes et propose un point à viser. */
export default function ReviewSection({ entries, library, settings, today }: Props) {
  const [reviews, setReviews] = useState<WeeklyReview[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [older, setOlder] = useState(false)
  const [open, setOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)

  useEffect(() => {
    void loadReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
  }, [])

  const win = reviewWindow(entries, today)
  const targeted = useMemo(() => reviews.slice(0, 4).map((r) => r.focus.pattern), [reviews])
  const latest = reviews[0]

  async function make() {
    setError('')
    if (!settings.apiKey) {
      setError('Ajoute ta clé API dans les réglages pour faire le bilan.')
      return
    }
    if (!navigator.onLine) {
      setError('Pas de réseau pour l’instant. Réessaie une fois connecté(e).')
      return
    }
    setBusy(true)
    try {
      const review = await requestReview(
        entries,
        library,
        settings,
        today,
        reviews.slice(0, 4).map((r) => r.focus.pattern),
      )
      setReviews(await addReview(review))
    } catch (e) {
      setError(
        e instanceof CorrectionFailure
          ? e.message
          : 'Le bilan n’a pas pu être fait. Réessaie.',
      )
    } finally {
      setBusy(false)
    }
  }

  const range = latest
    ? `Du ${shortDate(latest.from)} au ${shortDate(latest.to)} · ${latest.entryCount} entrée${latest.entryCount > 1 ? 's' : ''}`
    : `Pas de bilan · du ${shortDate(win.from)} au ${shortDate(win.to)}`

  const links = (
    <span className="review-links fr">
      <button
        type="button"
        className="link"
        disabled={busy || win.entries.length === 0}
        onClick={() => {
          setOpen(true)
          void make()
        }}
      >
        {busy ? 'Relecture en cours…' : latest ? 'Refaire le bilan' : 'Faire le bilan'}
      </button>
      <button
        type="button"
        className="link"
        aria-expanded={copyOpen}
        onClick={() => {
          setOpen(true)
          setCopyOpen((v) => !v)
        }}
      >
        Copier pour Claude
      </button>
    </span>
  )

  return (
    <Block
      role="write"
      ja="週"
      title="Bilan de la semaine"
      className="stat-block week-block"
      open={open}
      onToggle={() => setOpen((v) => !v)}
      summary={
        <>
          {range}
          {links}
        </>
      }
    >
      {open && <p className="fr review-line">{range}</p>}
      {open && latest && <ReviewView review={latest} furigana={settings.furiganaFrom} />}
      {open && !latest && (
        <p className="fr empty">
          Claude relit tes entrées des 7 derniers jours : ce qui progresse, ce qui revient,
          et un point de grammaire à viser ensuite.
        </p>
      )}
      {open && reviews.length > 1 && (
        <>
          <button type="button" className="fold review-older" aria-expanded={older} onClick={() => setOlder((v) => !v)}>
            <span className="fr">Bilans précédents ({reviews.length - 1})</span>
            <span className="fold-icon">
              <Chevron dir={older ? 'down' : 'right'} size={20} />
            </span>
          </button>
          {older &&
            reviews.slice(1).map((r) => <ReviewView key={r.createdAt} review={r} furigana={settings.furiganaFrom} />)}
        </>
      )}

      {open && links}
      {copyOpen && (
        <CopyForClaude entries={entries} library={library} settings={settings} today={today} alreadyTargeted={targeted} />
      )}
      {win.entries.length === 0 && <p className="fr">Écris une entrée cette semaine pour pouvoir faire le bilan.</p>}
      {error && (
        <p className="problem" role="alert">
          {error}
        </p>
      )}
    </Block>
  )
}
