import { useEffect } from 'react'
import type { Achievement } from '../achievements'

const SHOW_MS = 4000

/**
 * Petite célébration d'un nouveau succès : une carte discrète, une seule fois.
 * Elle se ferme d'un tap, ou seule au bout de quelques secondes. Sans mouvement
 * si le téléphone réduit les animations (voir le CSS).
 */
export default function Celebration({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, SHOW_MS)
    return () => window.clearTimeout(timer)
  }, [achievement.id, onClose])

  return (
    <div className="celebration" role="status" aria-live="polite" onClick={onClose}>
      <div className="celebration-card">
        <div className="celebration-spark" aria-hidden="true">✦ · ✧ · ✦</div>
        <p className="celebration-kicker fr">Succès débloqué</p>
        <p className="celebration-name">{achievement.name}</p>
        <p className="celebration-condition fr">{achievement.condition}.</p>
        <p className="celebration-hint fr">touche l'écran pour fermer</p>
      </div>
    </div>
  )
}
