# 日記 (nikki-app)

Petit journal quotidien en japonais, installable sur téléphone (PWA).
Écriture, sauvegarde locale, historique, réglages, et correction par l'API Claude
(version plus naturelle, erreurs expliquées en japonais N4-N3, points de grammaire,
furigana filtrés selon un seuil de niveau).

## Correction

1. Réglages → colle ta clé API Claude (elle reste sur le téléphone).
2. Écrire → Corriger. La correction s'affiche sous le texte et se retrouve dans l'historique.
3. Sans réseau, la demande attend : elle part à la prochaine ouverture de l'appli avec du réseau.

L'appel se fait depuis le navigateur vers `api.anthropic.com`, avec la réponse imposée
sous forme d'outil (`submit_correction`, voir `src/api.ts`). Les textes japonais de la
réponse contiennent un balisage `{漢字|かんじ|N4}` que `src/furigana.tsx` transforme en
furigana selon le réglage.

## Idées du jour

Sur l'écran Écrire, « Besoin d'une idée ? » propose un sujet, un point de grammaire
N4/N3 à placer (avec exemple) et trois mots de vocabulaire. « Autre idée » en tire une
nouvelle ; « Retirer le sujet » l'enlève. Le contenu est dans `src/prompts/data.ts`
(à compléter librement, le balisage `{漢字|かんじ}` est le même que pour la correction) ;
`src/prompts/pick.ts` choisit en évitant les points déjà vus dans les 14 dernières entrées.
Le point visé est transmis à la correction, qui dit s'il a été bien employé.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173 (accessible sur le réseau local)
```

Pour tester sur ton téléphone Android pendant le développement, branche-le sur le
même Wi-Fi et ouvre l'adresse « Network » affichée par Vite. L'installation comme
appli (service worker) demande HTTPS : elle ne marchera qu'une fois l'appli hébergée
(étape 4), ou via `chrome://inspect` avec redirection de port vers `localhost`.

## Construire

```bash
npm run build      # génère dist/
npm run preview    # sert dist/ pour vérifier la version de production
```

## Où sont les données ?

Dans IndexedDB, sur l'appareil (base `nikki`) : une entrée par jour, plus les réglages
(dont la clé API). Rien n'est envoyé ailleurs, hormis le texte envoyé à l'API pour la correction. Réglages → Exporter pour faire une
sauvegarde JSON, Importer pour la restaurer.

## Structure

```
src/
  db.ts              IndexedDB : entrées et réglages
  api.ts             appel à l'API Claude, consigne de correction, schéma de la réponse
  corrector.ts       lance une correction, file d'attente hors-ligne
  furigana.tsx       balisage {kanji|lecture|niveau} et affichage filtré
  prompts/           contenu et tirage des idées du jour
  components/        vue de la correction, note d'idée
  types.ts           types, réglages par défaut (seuil furigana, niveau)
  pages/             Écrire, Historique, Réglages
public/              icônes PWA
vite.config.ts       manifest PWA + service worker
```
