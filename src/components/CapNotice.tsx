import { useEffect, useState } from 'react'
import { loadUsage } from '../db'
import { ENTRY_UPDATED } from '../corrector'
import { CAP_ALERT_SHARE, capNoticeSeen, capShare, formatCost, markCapNoticeSeen, monthId, monthUsage } from '../usage'
import type { Settings } from '../types'

interface Props {
  settings: Settings
}

/**
 * Message doux à 80 % du plafond du mois : affiché une seule fois par mois,
 * jusqu'à ce qu'on le ferme. Il ne bloque jamais l'écriture ni la correction.
 */
export default function CapNotice({ settings }: Props) {
  const [cost, setCost] = useState(0)
  const [seen, setSeen] = useState(() => capNoticeSeen())

  useEffect(() => {
    const refresh = () =>
      void loadUsage()
        .then((log) => setCost(monthUsage(log, monthId()).cost))
        .catch(() => setCost(0))
    refresh()
    window.addEventListener(ENTRY_UPDATED, refresh)
    return () => window.removeEventListener(ENTRY_UPDATED, refresh)
  }, [])

  const share = capShare(cost, settings.monthlyCap)
  if (seen || share < CAP_ALERT_SHARE) return null

  return (
    <div className="backup-reminder cap-notice" role="status">
      <p>
        {share >= 1
          ? `Tu as atteint ton plafond du mois (≈ ${formatCost(cost)} sur ${formatCost(settings.monthlyCap)}).`
          : `Tu approches de ton plafond du mois (≈ ${formatCost(cost)} sur ${formatCost(settings.monthlyCap)}).`}{' '}
        Rien n'est bloqué : tu peux continuer à écrire et à corriger.
      </p>
      <div className="row">
        <button
          type="button"
          className="link"
          onClick={() => {
            markCapNoticeSeen()
            setSeen(true)
          }}
        >
          Compris
        </button>
      </div>
    </div>
  )
}
