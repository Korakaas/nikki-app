import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/**
 * Bouton « ? » : un tap affiche une phrase d'explication sous le bloc, un tap ailleurs la ferme.
 * `children` est le contenu à côté du bouton (un chiffre, un titre…).
 */
export default function InfoTip({
  text,
  children,
  className = '',
}: {
  text: string
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (box.current && e.target instanceof Node && box.current.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div className={`tip-box ${className}`.trim()} ref={box}>
      <div className="tip-line">
        {children}
        <button
          type="button"
          className="tip-btn"
          aria-label="Explication"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          ?
        </button>
      </div>
      {open && (
        <p id={id} className="tip-text fr" role="note">
          {text}
        </p>
      )}
    </div>
  )
}
