import { useEffect, useState } from 'react'
import { listEntries } from '../db'
import { pickMemory, type Memory } from '../memory'
import { formatDateJa } from '../format'
import Chevron from './Chevron'

/** « Il y a un mois, tu écrivais… » : relire une ancienne entrée pour mesurer le chemin fait. */
export default function MemoryCard({ id }: { id: string }) {
  const [memory, setMemory] = useState<Memory | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    void listEntries()
      .then((all) => {
        if (!cancelled) setMemory(pickMemory(all, id))
      })
      .catch(() => undefined)
    setOpen(false)
    return () => {
      cancelled = true
    }
  }, [id])

  if (!memory) return null
  const { entry, daysAgo } = memory
  const errors = entry.correction?.errors.length
  const when =
    daysAgo >= 28 && daysAgo <= 33 ? 'Il y a un mois' : daysAgo < 14 ? 'Il y a une semaine' : `Il y a ${daysAgo} jours`

  return (
    <section className="memory" aria-label="Souvenir">
      <button type="button" className="fold" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="fold-title">
          <span lang="ja" className="part-ja">
            思い出
          </span>{' '}
          <span className="fr">
            {when}, tu écrivais…
          </span>
        </span>
        <span className="fold-icon">
          <Chevron dir={open ? 'down' : 'right'} size={20} />
        </span>
      </button>
      {open && (
        <div className="memory-body">
          <p className="fr muted">{formatDateJa(entry.id, true)}</p>
          <p className="sheet memory-text" lang="ja">
            {entry.text.trim()}
          </p>
          {errors !== undefined && (
            <p className="fr muted">
              {errors === 0 ? 'Sans faute relevée.' : `${errors} faute${errors > 1 ? 's' : ''} relevée${errors > 1 ? 's' : ''} à l'époque.`}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
