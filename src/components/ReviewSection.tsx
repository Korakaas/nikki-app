import { useEffect, useState } from 'react'
import Chevron from './Chevron'
import { CorrectionFailure } from '../api'
import { addReview, loadReviews } from '../db'
import { Jp } from '../furigana'
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

      <h3 className="sub fr">À viser la semaine prochaine</h3>
      <div className="review-focus">
        <p className="review-pattern green-ink" lang="ja">
          {focus.pattern}
          <span className="fr"> · {focus.level}</span>
        </p>
        <p className="review-text">{focus.fr}</p>
        {focus.why && <p className="review-text review-why">{focus.why}</p>}
        {focus.example && (
          <p className="note-example blue-ink" lang="ja">
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

  useEffect(() => {
    void loadReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
  }, [])

  const win = reviewWindow(entries, today)
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
      const review = await requestReview(entries, library, settings, today)
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

  return (
    <>
      <h2 className="part">
        <span lang="ja">週の振り返り</span>
        <span className="fr">Bilan de la semaine</span>
      </h2>

      {latest && <ReviewView review={latest} furigana={settings.furiganaFrom} />}

      {!latest && (
        <p className="fr empty">
          Claude relit tes entrées des 7 derniers jours : erreurs qui reviennent,
          progrès, et un point de grammaire à viser ensuite.
        </p>
      )}

      <div className="actions review-actions">
        <button
          type="button"
          className="sketch primary"
          disabled={busy || win.entries.length === 0}
          onClick={() => void make()}
        >
          {busy ? 'Relecture en cours…' : latest ? 'Refaire le bilan' : 'Faire le bilan'}
        </button>
      </div>
      {win.entries.length === 0 && (
        <p className="fr">Écris une entrée cette semaine pour pouvoir faire le bilan.</p>
      )}
      {error && (
        <p className="problem" role="alert">
          {error}
        </p>
      )}

      {reviews.length > 1 && (
        <>
          <button
            type="button"
            className="fold review-older"
            aria-expanded={older}
            onClick={() => setOlder((v) => !v)}
          >
            <span className="fr">Bilans précédents ({reviews.length - 1})</span>
            <span className="fold-icon">
              <Chevron dir={older ? 'down' : 'right'} size={20} />
            </span>
          </button>
          {older &&
            reviews.slice(1).map((r) => (
              <ReviewView key={r.createdAt} review={r} furigana={settings.furiganaFrom} />
            ))}
        </>
      )}
    </>
  )
}
