import { useEffect, useState } from 'react'
import { BACKUP_EVENT, backupStatus, canShareFile, exportBackup, snoozeReminder } from '../backup'
import type { Settings } from '../types'

interface Props {
  settings: Settings
}

/** Bandeau discret : le journal ne vit que sur le téléphone, on le rappelle chaque semaine. */
export default function BackupReminder({ settings }: Props) {
  const [due, setDue] = useState(false)
  const [days, setDays] = useState(0)
  const [never, setNever] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const refresh = () =>
      void backupStatus().then((s) => {
        setDue(s.due)
        setDays(s.days ?? 0)
        setNever(s.never)
      })
    refresh()
    window.addEventListener(BACKUP_EVENT, refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener(BACKUP_EVENT, refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  if (!due) return null

  async function save() {
    setBusy(true)
    try {
      await exportBackup(settings, true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="backup-reminder" role="status">
      <p>
        {never
          ? `Ton journal n'a encore jamais été sauvegardé (première entrée il y a ${days} jours).`
          : `Dernière sauvegarde il y a ${days} jours.`}{' '}
        Il ne vit que sur ce téléphone.
      </p>
      <div className="row">
        <button type="button" className="primary" disabled={busy} onClick={() => void save()}>
          {canShareFile() ? 'Sauvegarder (Drive, e-mail…)' : 'Télécharger la sauvegarde'}
        </button>
        <button type="button" className="link" onClick={() => void snoozeReminder()}>
          Plus tard
        </button>
      </div>
    </div>
  )
}
