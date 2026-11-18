import { useEffect, useMemo, useState } from 'react'
import { deckVerbs } from '../conj/verbs'
import { FORMS } from '../conj/engine'
import {
  buildSession,
  conjStats,
  restoreVerbs,
  unlockAll,
  unlockedForms,
  dueItems,
  EMPTY_CONJ,
  type ConjState,
  type SessionItem,
} from '../conj/srs'
import { loadConj, saveConj, todayId } from '../db'
import type { AnkiLibrary } from '../types'
import ConjSession from './ConjSession'

const heading = (
  <h2 className="part">
    <span lang="ja">活用</span>
    <span className="fr">Conjugaison</span>
  </h2>
)

/** Entraînement à la conjugaison, avec les verbes de ton deck Anki. */
export default function ConjSection({ library }: { library: AnkiLibrary | null }) {
  const verbs = useMemo(() => deckVerbs(library), [library])
  const [state, setState] = useState<ConjState | null>(null)
  const [session, setSession] = useState<{ kind: 'form' | 'group'; items: SessionItem[] } | null>(null)
  const today = todayId()

  useEffect(() => {
    void loadConj()
      .then(setState)
      .catch(() => setState({ ...EMPTY_CONJ, cards: {}, recent: [], hidden: [] }))
  }, [session])

  if (!state) return null

  if (verbs.length === 0) {
    return (
      <>
        {heading}
        <p className="fr empty">
          Aucun verbe repéré : importe ton deck Anki dans les réglages (et active les paquets de vocabulaire).
        </p>
      </>
    )
  }

  function start(kind: 'form' | 'group') {
    setSession({ kind, items: buildSession(state!, verbs, today, kind, 10) })
  }

  if (session) {
    return (
      <>
        {heading}
        <ConjSession
          key={session.items.map((i) => i.verb.ja + i.form).join()}
          items={session.items}
          onClose={() => setSession(null)}
          onAgain={() => start(session.kind)}
        />
      </>
    )
  }

  const stats = conjStats(state, verbs, today)
  const dueForm = dueItems(state, verbs, today, 'form').length
  const dueGroup = dueItems(state, verbs, today, 'group').length
  const unlocked = new Set(unlockedForms(state))
  const next = FORMS.filter((f) => !unlocked.has(f.id))

  async function update(next: ConjState) {
    setState(next)
    await saveConj(next).catch(() => undefined)
  }

  return (
    <>
      {heading}
      <p className="fr">
        {verbs.length} verbes de ton deck · {stats.seen} carte{stats.seen > 1 ? 's' : ''} vue
        {stats.seen > 1 ? 's' : ''} · {stats.acquired} bien acquise{stats.acquired > 1 ? 's' : ''}
        {stats.due > 0 ? ` · ${stats.due} à revoir aujourd'hui` : ''}
      </p>
      <p className="fr empty">
        Formes débloquées :{' '}
        <span lang="ja">{FORMS.filter((f) => unlocked.has(f.id)).map((f) => f.ja).join('、')}</span>
        {next.length > 0 && ' (les suivantes arrivent quand tu réussis 75 % de 20 réponses).'}
      </p>
      <div className="actions">
        <button type="button" className="sketch primary" onClick={() => start('form')}>
          Mets-le à la forme…{dueForm > 0 ? ` (${dueForm})` : ''}
        </button>
        <button type="button" className="sketch" onClick={() => start('group')}>
          Quel groupe ?{dueGroup > 0 ? ` (${dueGroup})` : ''}
        </button>
      </div>
      {next.length > 0 && (
        <p className="fr quiz-hide">
          <button type="button" className="link" onClick={() => void update(unlockAll(state))}>
            Tout débloquer maintenant
          </button>
        </p>
      )}

      {stats.groupRight + stats.groupWrong > 0 && (
        <p className="fr empty">
          Groupe reconnu : {stats.groupRight} fois sur {stats.groupRight + stats.groupWrong}.
        </p>
      )}

      {stats.resistant.length > 0 && (
        <>
          <h3 className="sub fr">Verbes qui résistent</h3>
          <ul className="point-list" lang="ja">
            {stats.resistant.map((r) => (
              <li key={r.verb.ja}>
                <span className="mark red-ink">△</span> {r.verb.ja}
                {r.verb.reading !== r.verb.ja && <span className="fr"> ({r.verb.reading})</span>}
                <span className="fr">
                  {' '}
                  — {r.wrong} erreur{r.wrong > 1 ? 's' : ''}, {r.right} réussite{r.right > 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {state.hidden.length > 0 && (
        <p className="fr quiz-hide">
          {state.hidden.length} verbe{state.hidden.length > 1 ? 's' : ''} retiré
          {state.hidden.length > 1 ? 's' : ''} ·{' '}
          <button type="button" className="link" onClick={() => void update(restoreVerbs(state))}>
            les remettre
          </button>
        </p>
      )}
    </>
  )
}
