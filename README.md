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
N4, N3 ou N2 (selon Réglages → Niveau visé) à placer (avec exemple) et trois mots de vocabulaire. « Autre idée » en tire une
nouvelle ; « Retirer le sujet » l'enlève. Le contenu est dans `src/prompts/data.ts` et `src/prompts/more.ts` (une centaine de points N4, N3 et N2)
(à compléter librement, le balisage `{漢字|かんじ}` est le même que pour la correction) ;
`src/prompts/pick.ts` choisit en évitant les points déjà vus dans les 14 dernières entrées.
Le point visé est transmis à la correction, qui dit s'il a été bien employé.

### Série et grammaire placée

L'écran Écrire montre les sept derniers jours en ronds (plein = une entrée écrite ; toucher un rond ouvre ce jour) et la série en cours. L'Historique ajoute le record et le nombre de points de grammaire jugés « bien employés » par les corrections (`src/stats.ts`). Les idées du jour proposent trois fois plus souvent un point jamais bien employé.

### Statistiques

L'onglet Stats (`src/pages/StatsPage.tsx`) résume l'écriture (jours, série, caractères), les caractères par mois, les erreurs par type avec leur évolution pour 100 caractères, et la grammaire bien placée ou à revoir. Tout est calculé sur le téléphone à partir des entrées et des corrections.

### Bilan de la semaine

Dans l'onglet Stats, « Faire le bilan » envoie à Claude les entrées des 7 derniers jours (texte, erreurs relevées, comparaison avec les trois semaines d'avant) et rend : un résumé, les erreurs qui reviennent, ce qui progresse, et un point de grammaire à viser (`src/review.ts`). Les bilans sont gardés sur le téléphone (les 12 derniers). Le point visé devient la première idée du jour pendant dix jours, ou jusqu'à ce qu'il ait été bien employé deux fois.

### Revoir ses erreurs (quiz)

Toujours dans Stats : 5 questions tirées des erreurs corrigées (ta phrase avec un blanc, quatre formes à choisir). Les types d'erreurs les plus fréquents et les erreurs ratées reviennent en priorité ; celles réussies hier sortent moins (`src/quiz.ts`). Aucun appel à l'API.

### Photos et autocollants

Sous le bouton Corriger : « Photos et autocollants » ajoute des photos (réduites à 1000 px, JPEG) collées en polaroïd, et des autocollants dessinés en SVG (`src/components/stickers.tsx`, à compléter). Ils apparaissent aussi dans l'Historique et dans la sauvegarde.

### Cartes Anki

Réglages → Cartes Anki → Importer un export. L'appli lit les exports « Notes en texte brut »
(`.txt`) : ton deck de grammaire (type de note « GRAM N3 »), JLPT Tango et le deck JLPT N3
(`src/anki.ts`). Les notes sont stockées sur le téléphone (IndexedDB) ; chaque deck peut être
décoché. Avec un deck de grammaire importé, la moitié des points proposés (en niveau N3) en
viennent, le reste vient de la liste intégrée (N3 et N4). Deux mots sur trois viennent de tes
decks. Réimporter un fichier remplace les notes des decks qu'il contient.

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
(dont la clé API). Rien n'est envoyé ailleurs, hormis le texte envoyé à l'API pour la correction. Réglages → Sauvegarder… ouvre le
menu de partage d'Android (Drive, e-mail…), Télécharger écrit le fichier JSON, Importer le restaure
(entrées, photos, cartes Anki ; les réglages seulement sur un appareil neuf, sans clé API). La clé API n'est jamais
dans la sauvegarde. Un bandeau le rappelle sur l'écran Écrire quand la dernière sauvegarde a plus de 7 jours (`src/backup.ts`).

## Structure

```
src/
  db.ts              IndexedDB : entrées et réglages
  api.ts             appel à l'API Claude, consigne de correction, schéma de la réponse
  corrector.ts       lance une correction, file d'attente hors-ligne
  furigana.tsx       balisage {kanji|lecture|niveau} et affichage filtré
  stats.ts           séries de jours, grammaire déjà bien employée
  review.ts          bilan de la semaine (appel à Claude)
  quiz.ts            mini-quiz d'erreurs
  backup.ts          sauvegarde, import, rappel hebdomadaire
  image.ts           réduction des photos
  anki.ts            lecture des exports Anki (.txt) et fusion
  prompts/           contenu et tirage des idées du jour
  components/        vue de la correction, note d'idée
  types.ts           types, réglages par défaut (seuil furigana, niveau)
  pages/             Écrire, Historique, Stats, Réglages
public/              icônes PWA
vite.config.ts       manifest PWA + service worker
```
