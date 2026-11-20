import type { DailyPrompt } from '../types'
import Chevron from './Chevron'

interface Props {
  prompt: DailyPrompt | null
  /** Une série « J'ai 2 minutes » a été terminée aujourd'hui. */
  reviewDone: boolean
  onTheme: () => void
  onReview: () => void
}

/**
 * La carte « Aujourd'hui » : deux lignes sous le pouce (thème, révision).
 * Rien n'y est en retard ni en rouge : ce sont des portes d'entrée, pas une liste de devoirs.
 */
export default function TodayCard({ prompt, reviewDone, onTheme, onReview }: Props) {
  return (
    <section className="today-card" aria-label="Aujourd'hui">
      <h2 className="today-title">Aujourd'hui</h2>
      <ul className="today-rows">
        <li>
          <button type="button" className="today-row" onClick={onTheme}>
            <span className="today-key" lang="ja" aria-hidden="true">
              題
            </span>
            <span className="today-text">
              <span className="today-name fr">Thème</span>
              <small className="fr">{prompt ? prompt.topic.fr : 'Une idée, si tu veux'}</small>
            </span>
            <Chevron dir="right" size={20} />
          </button>
        </li>
        <li>
          <button type="button" className="today-row" onClick={onReview}>
            <span className="today-key" lang="ja" aria-hidden="true">
              復習
            </span>
            <span className="today-text">
              <span className="today-name fr">
                Révision
                {reviewDone && (
                  <span className="today-done green-ink" role="img" aria-label="Fait aujourd'hui">
                    {' '}
                    ✓
                  </span>
                )}
              </span>
              <small className="fr">
                {reviewDone ? "Fait aujourd'hui · encore 5 questions ?" : "J'ai 2 minutes · 5 questions, sans réglage"}
              </small>
            </span>
            <Chevron dir="right" size={20} />
          </button>
        </li>
      </ul>
    </section>
  )
}
