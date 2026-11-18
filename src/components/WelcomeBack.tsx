import { useEffect, useState } from 'react'

const KEY = 'nikki-welcome-back'

function seen(lastDay: string): boolean {
  try {
    return localStorage.getItem(KEY) === lastDay
  } catch {
    return false
  }
}

function markSeen(lastDay: string): void {
  try {
    localStorage.setItem(KEY, lastDay)
  } catch {
    /* stockage indisponible : le message pourra revenir, sans conséquence */
  }
}

interface Props {
  /** Dernier jour écrit quand on revient après une pause (au moins 2 jours sans entrée), sinon null. */
  lastDay: string | null
  /** Met le curseur dans l'entrée. */
  onStart: () => void
}

/**
 * Accueil après une pause : court, sans compter les jours manqués, une seule fois par retour
 * (un retour = un « dernier jour écrit » différent). Une fois affiché, il reste jusqu'à
 * « Plus tard », même si on commence à écrire, pour que la page ne saute pas sous le doigt.
 */
export default function WelcomeBack({ lastDay, onStart }: Props) {
  const [shownFor, setShownFor] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (lastDay && shownFor === null && !seen(lastDay)) {
      setShownFor(lastDay)
      markSeen(lastDay)
    }
  }, [lastDay, shownFor])

  if (!shownFor || hidden) return null

  return (
    <div className="welcome-back" role="status" lang="fr">
      <p>Content de te revoir. Deux phrases suffisent pour aujourd'hui.</p>
      <div className="row">
        <button
          type="button"
          className="sketch"
          onClick={() => {
            setHidden(true)
            onStart()
          }}
        >
          Écrire deux phrases
        </button>
        <button type="button" className="link" onClick={() => setHidden(true)}>
          Plus tard
        </button>
      </div>
    </div>
  )
}
