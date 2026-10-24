import { useState } from 'react'
import { Jp } from '../furigana'
import Chevron from './Chevron'
import type { DailyPrompt, FuriganaFrom } from '../types'

interface Props {
  prompt: DailyPrompt
  furigana: FuriganaFrom
  onAnother: () => void
  onRemove: () => void
}

/** Petit mot collé en haut de la page : le sujet, un point de grammaire, trois mots. */
export default function PromptNote({ prompt, furigana, onAnother, onRemove }: Props) {
  const { topic, grammar, words } = prompt
  const [open, setOpen] = useState(false)
  return (
    <aside className="note-card" lang="ja" aria-label="Idée du jour">
      <span className="tape" aria-hidden="true" />

      <h2 className="note-title blue-ink">
        <button
          type="button"
          className="fold"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span>今日のお題</span>
          <span className="fr">Idée du jour</span>
          <span className="fold-icon">
            <Chevron dir={open ? 'down' : 'right'} size={22} />
          </span>
        </button>
      </h2>
      {!open && (
        <p className="note-summary blue-ink">
          <Jp text={topic.ja} furigana={furigana} />
          <span className="fr"> · {grammar.pattern}</span>
        </p>
      )}
      {open && (
        <>
      <p className="note-topic blue-ink">
        <Jp text={topic.ja} furigana={furigana} />
      </p>
      <p className="note-fr fr">{topic.fr}</p>

      <h3 className="note-part blue-ink">
        <span>文法</span>
        <span className="fr">
          Grammaire {grammar.level}
          {grammar.fromAnki ? ' · ton deck' : ''}
        </span>
      </h3>
      <p className="note-pattern green-ink">{grammar.pattern}</p>
      <p className="note-fr fr">{grammar.fr}</p>
      {grammar.example && (
        <p className="note-example blue-ink">
          <Jp text={grammar.example} furigana={furigana} />
        </p>
      )}
      {grammar.exampleFr && <p className="note-fr fr">{grammar.exampleFr}</p>}

      <h3 className="note-part blue-ink">
        <span>単語</span>
        <span className="fr">Mots</span>
      </h3>
      <ul className="note-words">
        {words.map((w) => (
          <li key={w.ja}>
            {w.reading ? (
              <ruby className="blue-ink">
                {w.ja}
                <rp>(</rp>
                <rt>{w.reading}</rt>
                <rp>)</rp>
              </ruby>
            ) : (
              <span className="blue-ink">{w.ja}</span>
            )}
            <span className="fr"> — {w.fr}</span>
          </li>
        ))}
      </ul>

      <div className="note-actions" lang="fr">
        <button type="button" className="link" onClick={onAnother}>
          Autre idée
        </button>
        <button type="button" className="link" onClick={onRemove}>
          Retirer le sujet
        </button>
      </div>
        </>
      )}
    </aside>
  )
}
