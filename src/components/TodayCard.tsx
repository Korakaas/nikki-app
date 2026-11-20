import type { DailyPrompt } from '../types'
import Chevron from './Chevron'

interface Props {
  prompt: DailyPrompt | null
  /** Nombre de caractères japonais déjà écrits aujourd'hui (0 = rien). */
  chars: number
  onTheme: () => void
  onEntry: () => void
  onReview: () => void
}

/**
 * La carte « Aujourd'hui » : trois lignes sous le pouce (thème, entrée, révision).
 * Rien n'y est en retard ni en rouge : ce sont des portes d'entrée, pas une liste de devoirs.
 */
export default function TodayCard({ prompt, chars, onTheme, onEntry, onReview }: Props) {
  const written = chars > 0
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
          <button type="button" className="today-row" onClick={onEntry}>
            <span className="today-key" lang="ja" aria-hidden="true">
              日記
            </span>
            <span className="today-text">
              <span className="today-name fr">Entrée</span>
              <small className="fr">
                {written ? (
                  <>
                    Écrite · {chars} 文字 <span aria-hidden="true">✓</span>
                  </>
                ) : (
                  'Pas encore écrite · deux phrases suffisent'
                )}
              </small>
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
              <span className="today-name fr">Révision</span>
              <small className="fr">J'ai 2 minutes · 5 questions, sans réglage</small>
            </span>
            <Chevron dir="right" size={20} />
          </button>
        </li>
      </ul>
    </section>
  )
}
