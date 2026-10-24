import { addDays } from '../format'

const KANJI = ['日', '月', '火', '水', '木', '金', '土']

interface Props {
  today: string
  selected: string
  written: Set<string>
  /** Jours d'affilée en cours. */
  streak: number
  onSelect: (id: string) => void
}

/** Les sept derniers jours en petits ronds : plein quand une entrée existe. */
export default function WeekStrip({ today, selected, written, streak, onSelect }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  return (
    <div className="week-wrap">
      <ul className="week" lang="ja">
        {days.map((id) => {
          const [y, m, d] = id.split('-').map(Number)
          const weekday = KANJI[new Date(y, m - 1, d).getDay()]
          const done = written.has(id)
          return (
            <li key={id}>
              <button
                type="button"
                className={[
                  'day',
                  done ? 'done' : '',
                  id === selected ? 'selected' : '',
                  id === today ? 'today' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={`${d}/${m}${done ? ', entrée écrite' : ', pas d’entrée'}`}
                aria-current={id === selected ? 'date' : undefined}
                onClick={() => onSelect(id)}
              >
                <span className="day-kanji" aria-hidden="true">
                  {weekday}
                </span>
                <span className="day-dot" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
      {streak > 0 && (
        <p className="streak green-ink" lang="fr">
          {streak} jour{streak > 1 ? 's' : ''} de suite
        </p>
      )}
    </div>
  )
}
