import { useEffect, useState } from 'react'
import { capabilities, pickTestFile, rewriteTestFile, type Capabilities } from '../autoBackupSpike'

const yesNo = (v: boolean | null) => (v === null ? 'inconnu' : v ? 'oui' : 'non')

/** Essai S16.1 : ce que ton téléphone permet vraiment pour une sauvegarde automatique. Écrit seulement un fichier d'essai. */
export default function AutoBackupTest() {
  const [caps, setCaps] = useState<Capabilities | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void capabilities().then(setCaps).catch(() => setCaps(null))
  }, [])

  async function run(action: () => Promise<string>) {
    setBusy(true)
    setMessage(await action())
    setBusy(false)
  }

  return (
    <>
      {caps && (
        <ul className="hint spike-list">
          <li>Appli installée : {yesNo(caps.installed)}</li>
          <li>Choisir un fichier où écrire : {yesNo(caps.savePicker)}</li>
          <li>Choisir un dossier : {yesNo(caps.dirPicker)}</li>
          <li>Tâche de fond planifiée : {yesNo(caps.periodicSync)}</li>
          <li>
            Stockage protégé du nettoyage : {yesNo(caps.persisted)}
            {caps.persisted === false && ' (Chrome l’accorde surtout à une appli installée et ouverte souvent : réessaie dans quelques jours)'}
            {caps.persisted === null && ' (ce navigateur ne le dit pas)'}
          </li>
        </ul>
      )}
      <div className="row">
        <button type="button" disabled={busy} onClick={() => void run(pickTestFile)}>
          1. Choisir un fichier d'essai
        </button>
        <button type="button" disabled={busy} onClick={() => void run(rewriteTestFile)}>
          2. Réécrire dedans
        </button>
      </div>
      {message && (
        <p className="hint" role="status">
          {message}
        </p>
      )}
      <p className="hint">
        Essai facultatif, 2 minutes : étape 1, puis ferme et rouvre l'appli, puis étape 2. Seul un petit fichier « nikki-essai » est écrit :
        tes entrées ne sont pas touchées.
      </p>
    </>
  )
}
