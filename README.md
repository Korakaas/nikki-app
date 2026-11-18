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

### Lien entre sujet, mots et grammaire

- Les mots de ton deck sont choisis en priorité s'ils ont un rapport avec le sujet du jour (mots-clés français et kanji par thème, `src/prompts/themes.ts`).
- Dès qu'une idée est tirée, Claude écrit en arrière-plan une phrase d'exemple qui relie le sujet, le point de grammaire et des mots du jour, avec un conseil (`src/link.ts`, outil `submit_link`). Elle s'affiche dans la carte, section « Tout ensemble », et se garde avec l'entrée ; un bouton permet de la redemander si elle a échoué ou si tu étais hors ligne.
- Les mots du jour sont cochés pendant que tu écris (`src/words.ts`, la forme conjuguée compte). Les statistiques gardent combien de fois chaque mot a été proposé et employé ; ceux jamais employés reviennent plus souvent, ceux déjà employés moins.

### Après la correction

Sous la correction : une « phrase bonus » proposée par Claude (dans le même appel que la correction, champ `bonus`), à ajouter à l'entrée d'un geste, puis une « révision éclair » : une question tirée de tes fautes des autres jours (`src/components/AfterCorrection.tsx`, même historique que le quiz des Stats).

### Série et grammaire placée

L'écran Écrire montre les sept derniers jours en ronds (plein = une entrée écrite ; toucher un rond ouvre ce jour) et la série en cours. L'Historique ajoute le record et le nombre de points de grammaire jugés « bien employés » par les corrections (`src/stats.ts`). Les idées du jour proposent trois fois plus souvent un point jamais bien employé.

### Statistiques

L'onglet Stats (`src/pages/StatsPage.tsx`) résume l'écriture (jours, série, caractères), les caractères par mois, les erreurs par type avec leur évolution semaine par semaine (fautes pour 100 caractères, jours écrits), les mots du jour employés, et la grammaire bien placée ou à revoir. Tout est calculé sur le téléphone à partir des entrées et des corrections.

### Bilan de la semaine

Dans l'onglet Stats, « Faire le bilan » envoie à Claude les entrées des 7 derniers jours (texte, erreurs relevées, comparaison avec les trois semaines d'avant) et rend : un résumé, les erreurs qui reviennent, ce qui progresse, et un point de grammaire à viser (`src/review.ts`). Les bilans sont gardés sur le téléphone (les 12 derniers). Le point visé devient la première idée du jour pendant 3 jours, ou jusqu’à ce qu’il ait été bien employé une fois.

### Revoir ses erreurs (quiz)

Toujours dans Stats : 5 questions tirées des erreurs corrigées (ta phrase avec un blanc, quatre formes à choisir). Les types d'erreurs les plus fréquents et les erreurs ratées reviennent en priorité ; celles réussies hier sortent moins (`src/quiz.ts`). Aucun appel à l'API.

### Exercices de particules

Dans Stats : 10 questions « quelle particule ? ». Les fautes de particule corrigées dans tes entrées passent en premier (`src/particles.ts` repère la particule changée par la correction) ; le reste vient d'une liste d'une trentaine de verbes à particule fixe (`会う → に`, `緊張する → に`…), à compléter dans ce même fichier. Les réponses alimentent le même historique que le quiz.

### Retirer une question

Sous chaque question du quiz, des exercices et de la révision éclair : « Retirer cette question ». Elle ne revient plus (drapeau `hidden` dans l'historique du quiz, gardé dans la sauvegarde).

### Réécrire sans regarder

Sous la correction : tu retapes ton texte corrigé de mémoire, l'appli compare caractère par caractère (ponctuation ignorée) et marque en rouge ce qui est faux, en vert ce qu'il fallait écrire (`src/rewrite.ts`).

### Entrées non corrigées

L'Historique marque « pas corrigée » les entrées sans correction, avec un bouton « Corriger maintenant ».

### Consommation de l'API

Chaque appel ajoute ses jetons (envoyés / reçus, par type d'appel et par mois) à un compteur local ; Réglages → « Consommation de l'API » montre l'estimation en dollars du mois en cours et du mois dernier (tarif Sonnet 5.5 dans `src/usage.ts`, à ajuster si le modèle change). Le compteur n'est pas dans la sauvegarde.

### Copier la semaine pour Claude

Dans le bilan (Stats), « Copier la semaine pour Claude » met dans le presse-papiers tes 7 derniers jours avec leurs corrections et les consignes du bilan, à coller dans une conversation avec Claude : un bilan sans appel à l'API.

### Défi de traduction

La phrase d'exemple du thème vient avec un défi : une phrase en français à traduire en japonais pour commencer l'entrée (champ `challenge`, absent des idées créées avant cette version).

### Modèle léger

La phrase d'exemple et le défi sont demandés à un modèle plus léger (Réglages → « Modèle léger », `claude-haiku-5-5` par défaut, environ 20 fois moins cher) ; s'il échoue, le modèle principal prend le relais. La correction et le bilan restent sur le modèle principal. Le compteur de coût applique le tarif de chaque modèle (`src/usage.ts`).

### Bilan du mois

Dans Stats, sans appel à l'API : jours écrits, caractères par entrée, fautes pour 100 caractères et fautes par type, comparés au mois d'avant (flèche seulement au-delà de 5 %), mots du jour employés, points de grammaire réussis pour la première fois, « à revoir puis réussis » et « encore à revoir ». Les flèches permettent de remonter mois par mois.

### Souvenir du jour

Sous l'idée du jour, une ligne « Il y a un mois, tu écrivais… » (l'entrée la plus proche d'il y a 30 jours, d'au moins une semaine) qui se déplie pour relire le texte d'alors et le nombre de fautes relevées (`src/memory.ts`).

### Conjugaison (活用)

Entraînement à la conjugaison, sans appel à l'API : tout se calcule sur le téléphone (`src/conj/`).

- **Verbes** : repérés dans le deck Anki (mots dont la fin est un kana en う, et noms suivis de « (する) »). Le deck n'indique pas la nature des mots, donc les locutions et mots-outils sont écartés par une liste ; le groupe (五段 / 一段 / irrégulier) se déduit de la lecture, avec une liste d'exceptions pour les verbes en る qui sont du groupe 1 (帰る, 知る, 切る, 入る…). Verbes sans forme ordinaire (ある, いる, くださる…) écartés.
- **Formes** : ない, なかった, ないで, た, て, ば, たら, たい, potentiel, passif, causatif, causatif passif, volitif, impératif, interdiction (pas la forme du dictionnaire ni la forme ます). Débloquées par paliers : ない・た・て, puis なかった・ないで・ば・たい, puis potentiel・passif・causatif, puis le reste. On passe au palier suivant à 75 % de bonnes réponses sur 20 ; « Tout débloquer maintenant » ouvre tout.
- **Exercices** : « Mets-le à la forme… » (réponse écrite, en kana ou en kanji) et « Quel groupe ? » (trois choix). Après chaque réponse : la bonne forme, la règle en français, et « Retirer ce verbe » si le deck se trompe de groupe ou de lecture. Une mauvaise réponse revient une fois à la fin de la série.
- **Révision espacée** : boîtes de 0 à 5 (révision aujourd'hui, 1, 3, 7, 14, 30 jours) ; une erreur renvoie à la boîte 0. Une série = 10 cartes (dues d'abord, puis nouvelles, avec plus de verbes aux finales trompeuses).
- **Conjugaison éclair** : après une correction, 3 cartes (dues d'abord) sous la révision éclair.
- **Stats** : cartes vues / acquises / à revoir, verbes qui résistent, verbes retirés.
- Données : ligne `conj` de la base (cartes, palier, verbes retirés), incluse dans la sauvegarde et fusionnée à l'import (carte la plus récente gagnante).
- Non géré pour l'instant : la forme en ら抜き, les adjectifs, les phrases à trous.

### Transitif / intransitif (自動詞・他動詞)

Dans Stats, 78 paires de verbes (開く / 開ける, 止まる / 止める…) rédigées à la main (`src/transitivity.ts`), sans appel à l'API.

- **Écrire le verbe** : une phrase japonaise avec un blanc (`ドアが＿＿＿。`) et sa traduction ; tu tapes le verbe, en kanji ou en kana. « Indice » montre les deux verbes de la paire (la réponse juste compte alors comme à revoir). Après la réponse : la bonne forme et la règle (が + verbe qui se produit seul, を + verbe où quelqu'un agit).
- **Choisir le verbe** : mêmes phrases, deux verbes au choix, et « transitif ou intransitif ? » pour un verbe seul.
- **Lien avec tes fautes** : les corrections passées sont lues pour repérer les verbes de ces paires (formes ない, た, て, ば, ます, たい, volitif). Si tu as employé l'autre verbe de la paire, ou si une particule a été corrigée dans une phrase avec un de ces verbes, la paire revient plus souvent (×4 ou ×2) et la liste des confusions s'affiche dans la section. En mode écrit, jusqu'à 3 de tes propres phrases corrigées reviennent en priorité : ta phrase avec un blanc, tu réécris le passage corrigé.
- Les paires dont un verbe est dans ton deck reviennent un peu plus souvent ; les ratés en premier ; « Retirer cette question » écarte une question. Résultats dans l'historique du quiz (clés `t|…` et `tw|…`, donc dans la sauvegarde). Un dépliant « Voir toutes les paires » sert d'aide-mémoire.

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
(entrées, photos, bilans, quiz, cartes Anki ; les réglages seulement sur un appareil neuf, sans clé API). La clé API n'est jamais
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
  transitivity.ts    paires 自動詞 / 他動詞 et exercices
  conj/              moteur de conjugaison, verbes du deck, révision espacée
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
