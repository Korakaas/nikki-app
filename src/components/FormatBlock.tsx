import { useEffect, useState } from 'react'
import { Jp, plainText } from '../furigana'
import { formatById, formatOfDay } from '../formats'
import { situationOfDay } from '../prompts/situations'
import type { FuriganaFrom } from '../types'
import Block from './Block'

interface Props {
  /** Jour affiché (YYYY-MM-DD) : le format et le texte ne dépendent que de la date. */
  id: string
  furigana: FuriganaFrom
  /** Texte en cours d'écriture : les amorces ne s'insèrent que si la page est vide. */
  text: string
  onStarter: (plain: string) => void
}

const KEY = 'nikki-format-open'

/**
 * Le format du jour (S5.4a) : un format d'écriture différent chaque jour, sans rien à choisir.
 * Il donne une consigne, une mise en situation tirée de la banque (la lettre à laquelle répondre,
 * la scène à décrire…) et deux amorces. Rien n'est imposé : écrire autre chose reste possible.
 */
export default function FormatBlock({ id, furigana, text, onStarter }: Props) {
  const format = formatById(formatOfDay(id))
  const situation = situationOfDay(id)
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== '0'
    } catch {
      return true
    }
  })
  const [aide, setAide] = useState(false)
  // L'aide se referme d'un jour à l'autre.
  useEffect(() => setAide(false), [id])

  const toggle = () =>
    setOpen((v) => {
      try {
        localStorage.setItem(KEY, v ? '0' : '1')
      } catch {
        /* stockage indisponible : le choix ne sera pas gardé */
      }
      return !v
    })

  const empty = text.trim() === ''

  return (
    <Block
      role="write"
      ja="形"
      title="Format du jour"
      className="format-block"
      open={open}
      onToggle={toggle}
      summary={
        <>
          <span lang="ja">{format.ja}</span> · {format.fr}
        </>
      }
    >
      <div className="format-body">
        <p className="format-name">
          <span lang="ja">{format.ja}</span> · <span className="fr">{format.fr}</span>
        </p>
        <p className="format-consigne fr">{format.consigne}</p>

        {situation && (
          <div className="format-situation">
            <p className="format-text" lang="ja">
              <Jp text={situation.ja} furigana={furigana} />
            </p>
            {situation.words && (
              <ul className="format-words" lang="ja">
                {situation.words.map((w) => (
                  <li key={w.ja}>
                    <Jp text={w.ja} furigana={furigana} /> <small className="fr">{w.fr}</small>
                  </li>
                ))}
              </ul>
            )}
            {situation.todo && <p className="format-todo fr">À toi : {situation.todo}</p>}
            <button type="button" className="link format-aide-button fr" aria-expanded={aide} onClick={() => setAide((v) => !v)}>
              {aide ? "Cacher l'aide" : 'Aide en français'}
            </button>
            {aide && <p className="format-aide fr">{situation.aide}</p>}
          </div>
        )}

        {empty && format.starters.length > 0 && (
          <div className="format-starters" role="group" aria-label="Amorces du format">
            {format.starters.map((st) => (
              <button
                key={st.ja}
                type="button"
                className="sketch starter format-starter"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onStarter(plainText(st.ja))}
              >
                <span className="starter-ja" lang="ja">
                  <Jp text={st.ja} furigana={furigana} />
                </span>
                <span className="starter-fr fr">{st.fr}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Block>
  )
}
