import type { ReactNode } from 'react'
import Chevron from './Chevron'

/** Rôle d'une section : la couleur de sa pastille (vert = écrire, rose = correction, 3e couleur = s'entraîner, gris = réglages). */
export type Role = 'write' | 'fix' | 'train' | 'set'

/** Petite pastille colorée avec le mot japonais de la section (S18.10). Seule elle porte la couleur. */
export function Pill({ role, children }: { role: Role; children: ReactNode }) {
  return (
    <span className={`pill pill-${role}`} lang="ja">
      {children}
    </span>
  )
}

/** Titre d'un bloc : la pastille, puis le titre en gras. */
export function BlockTitle({ role, ja, children }: { role: Role; ja: string; children: ReactNode }) {
  return (
    <h2 className="block-head">
      <Pill role={role}>{ja}</Pill>
      <span className="block-title">{children}</span>
    </h2>
  )
}

interface BlockProps {
  role: Role
  ja: string
  title: string
  /** Résumé d'une ligne, sous le titre, quand le bloc est replié. */
  summary?: ReactNode
  /** Bloc repliable : fournir `open` et `onToggle`. */
  open?: boolean
  onToggle?: () => void
  /** À droite du titre (ex. le menu « ⋯ »). */
  tail?: ReactNode
  className?: string
  /** Garde le contenu monté (caché) quand le bloc est replié : le bloc peut alors se cacher tout seul s'il est vide. */
  keepMounted?: boolean
  children?: ReactNode
}

/** Un bloc de page : cadre fin neutre, pastille colorée, titre, contenu (S18.10). */
export default function Block({ role, ja, title, summary, open, onToggle, tail, className, keepMounted, children }: BlockProps) {
  const foldable = onToggle !== undefined
  return (
    <section className={`block${className ? ` ${className}` : ''}`} aria-label={title}>
      <div className="block-top">
        {foldable ? (
          <h2 className="block-head block-fold">
            <button type="button" className="fold" aria-expanded={Boolean(open)} onClick={onToggle}>
              <Pill role={role}>{ja}</Pill>
              <span className="block-title">{title}</span>
              <span className="fold-icon">
                <Chevron dir={open ? 'down' : 'right'} size={22} />
              </span>
            </button>
          </h2>
        ) : (
          <BlockTitle role={role} ja={ja}>
            {title}
          </BlockTitle>
        )}
        {tail}
      </div>
      {summary && !open && <p className="block-sum fr">{summary}</p>}
      {keepMounted && foldable ? (
        <div className="block-body" hidden={!open}>
          {children}
        </div>
      ) : (
        (!foldable || open) && children
      )}
    </section>
  )
}
