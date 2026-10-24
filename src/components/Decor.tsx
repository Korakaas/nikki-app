import { useRef, useState } from 'react'
import { shrinkPhoto } from '../image'
import type { EntryPhoto, EntrySticker } from '../types'
import { StickerArt, STICKERS } from './stickers'

export const MAX_PHOTOS = 8
export const MAX_STICKERS = 16

function tiltOf(id: string): number {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return (Math.abs(h) % 7) - 3
}

interface BoardProps {
  photos: EntryPhoto[]
  stickers: EntrySticker[]
  /** Mode décor : une croix permet de retirer photos et autocollants. */
  onRemovePhoto?: (id: string) => void
  onRemoveSticker?: (id: string) => void
  small?: boolean
}

/** Les photos (polaroïds scotchés) et autocollants collés sur la page. */
export function DecorBoard({ photos, stickers, onRemovePhoto, onRemoveSticker, small }: BoardProps) {
  if (photos.length === 0 && stickers.length === 0) return null
  return (
    <div className={small ? 'decor-board small' : 'decor-board'}>
      {photos.map((p) => (
        <figure key={p.id} className="polaroid" style={{ transform: `rotate(${tiltOf(p.id)}deg)` }}>
          <span className="washi" aria-hidden="true" />
          <img src={p.src} alt="Photo de l'entrée" loading="lazy" />
          {onRemovePhoto && (
            <button
              type="button"
              className="decor-x"
              aria-label="Retirer la photo"
              onClick={() => onRemovePhoto(p.id)}
            >
              ×
            </button>
          )}
        </figure>
      ))}
      {stickers.map((s) => (
        <span key={s.id} className="sticker" style={{ transform: `rotate(${tiltOf(s.id) * 2}deg)` }}>
          <StickerArt kind={s.kind} size={small ? 30 : 48} />
          {onRemoveSticker && (
            <button
              type="button"
              className="decor-x"
              aria-label="Retirer l’autocollant"
              onClick={() => onRemoveSticker(s.id)}
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

interface Props {
  photos: EntryPhoto[]
  stickers: EntrySticker[]
  onChange: (photos: EntryPhoto[], stickers: EntrySticker[]) => void
}

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/** Bloc « photos et autocollants » de la page d'écriture. */
export default function Decor({ photos, stickers, onChange }: Props) {
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  // Dernières listes connues : plusieurs ajouts coup sur coup partent de la même base.
  const latest = useRef({ photos, stickers })
  latest.current = { photos, stickers }

  async function addPhotos(files: FileList) {
    setMessage('')
    for (const file of Array.from(files)) {
      if (latest.current.photos.length >= MAX_PHOTOS) {
        setMessage(`${MAX_PHOTOS} photos au maximum par page.`)
        break
      }
      try {
        const src = await shrinkPhoto(file)
        const next = [...latest.current.photos, { id: newId(), src }]
        latest.current = { ...latest.current, photos: next }
        onChange(next, latest.current.stickers)
      } catch {
        setMessage('Cette photo n’a pas pu être lue.')
      }
    }
  }

  function addSticker(kind: string) {
    if (latest.current.stickers.length >= MAX_STICKERS) {
      setMessage(`${MAX_STICKERS} autocollants au maximum par page.`)
      return
    }
    setMessage('')
    const next = [...latest.current.stickers, { id: newId(), kind }]
    latest.current = { ...latest.current, stickers: next }
    onChange(latest.current.photos, next)
  }

  const removePhoto = (id: string) => onChange(photos.filter((p) => p.id !== id), stickers)
  const removeSticker = (id: string) => onChange(photos, stickers.filter((s) => s.id !== id))

  return (
    <section className="decor" aria-label="Photos et autocollants">
      <DecorBoard
        photos={photos}
        stickers={stickers}
        onRemovePhoto={editing ? removePhoto : undefined}
        onRemoveSticker={editing ? removeSticker : undefined}
      />

      <button type="button" className="link decor-toggle" onClick={() => setEditing((v) => !v)}>
        {editing ? 'Terminer' : photos.length + stickers.length > 0 ? 'Modifier le décor' : 'Photos et autocollants'}
      </button>

      {editing && (
        <div className="decor-tray">
          <div className="row">
            <button type="button" onClick={() => fileInput.current?.click()}>
              Ajouter une photo
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) void addPhotos(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
          <ul className="sticker-palette" aria-label="Autocollants">
            {STICKERS.map((s) => (
              <li key={s.kind}>
                <button type="button" aria-label={`Ajouter : ${s.label}`} onClick={() => addSticker(s.kind)}>
                  <StickerArt kind={s.kind} size={40} />
                </button>
              </li>
            ))}
          </ul>
          {message && <p className="notice">{message}</p>}
        </div>
      )}
    </section>
  )
}
