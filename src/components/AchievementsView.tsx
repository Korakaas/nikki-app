import type { Achievement } from '../achievements'

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function longDate(id: string): string {
  const [y, m, d] = id.split('-').map(Number)
  return `${d === 1 ? '1er' : d} ${MONTHS[m - 1]}${y === new Date().getFullYear() ? '' : ` ${y}`}`
}

/** Les succès : ceux débloqués avec leur date, puis ceux à venir avec leur condition et leur progression. */
export default function AchievementsView({ achievements }: { achievements: Achievement[] }) {
  const done = achievements
    .filter((a) => a.done)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  const todo = achievements
    .filter((a) => !a.done)
    .sort((a, b) => ratio(b) - ratio(a))

  return (
    <>
      <h2 className="part">
        <span lang="ja">達成</span>
        <span className="fr">Succès · {done.length} sur {achievements.length}</span>
      </h2>
      <ul className="achievements" aria-label="Succès">
        {done.map((a) => (
          <li key={a.id} className="achievement done">
            <span className="ach-dot" aria-hidden="true">✓</span>
            <span className="ach-text">
              <span className="ach-name">{a.name}</span>
              <span className="ach-sub fr">débloqué le {a.date ? longDate(a.date) : ''}</span>
            </span>
          </li>
        ))}
        {todo.map((a) => (
          <li key={a.id} className="achievement todo">
            <span className="ach-dot" aria-hidden="true" />
            <span className="ach-text">
              <span className="ach-name">{a.name}</span>
              <span className="ach-sub fr">{a.condition}</span>
            </span>
            {a.progress && (
              <span className="ach-progress fr">
                {a.progress.value.toLocaleString('fr-FR')} / {a.progress.target.toLocaleString('fr-FR')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

function ratio(a: Achievement): number {
  return a.progress ? a.progress.value / a.progress.target : 0
}
