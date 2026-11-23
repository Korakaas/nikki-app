# 日記 (nikki-app)

Petit journal quotidien en japonais, installable sur téléphone (PWA).
Écriture, sauvegarde locale, historique, réglages, et correction par l'API Claude
(version plus naturelle, erreurs expliquées en japonais N4-N3, points de grammaire,
furigana filtrés selon un seuil de niveau).

## Écrans

Barre du bas : Écrire, Historique, Stats, Exercices, Réglages.

- **Stats** a deux onglets en bas de l'écran (au pouce), dont le dernier ouvert est mémorisé :
  - **Progrès** : cinq chiffres clés visibles sans défiler (jours écrits, jours de suite, caractères écrits,
    fautes pour 100 caractères, mots utilisés), puis mois par mois, erreurs, mots du jour et grammaire.
    Chaque chiffre et chaque graphique a un « ? » qui explique le calcul en une phrase (un tap ailleurs le ferme).
  - **Bilans** : le bilan de la semaine, replié par défaut (titre et ligne avec la semaine concernée), puis le bilan du mois.
- **Exercices** : quiz d'erreurs, particules, conjugaison, transitif ou intransitif (avant dans Stats), et une barre fixe en bas
  « J'ai 2 minutes · 5 questions » (voir ci-dessous).

## Correction

1. Réglages → colle ta clé API Claude (elle reste sur le téléphone).
2. Écrire → Corriger. La correction s'affiche sous le texte et se retrouve dans l'historique.
3. Sans réseau, la demande attend : elle part à la prochaine ouverture de l'appli avec du réseau.

La correction commence par un encouragement en français qui cite une phrase réelle de l'entrée (`praise`). Chaque faute s'affiche repliée (« avant → après ») ; un tap la déplie en trois blocs : pourquoi c'est faux, dans quel contexte c'est impossible, dans quel autre cas l'employer. Les blocs sans objet sont omis, et « Tout déplier » ouvre toutes les fautes d'un coup. Les anciennes corrections (commentaire en japonais, une seule explication) s'affichent toujours.

L'appel se fait depuis le navigateur vers `api.anthropic.com`, avec la réponse imposée
sous forme d'outil (`submit_correction`, voir `src/api.ts`). Les textes japonais de la
réponse contiennent un balisage `{漢字|かんじ|N4}` que `src/furigana.tsx` transforme en
furigana selon le réglage.

## Idées du jour

Sur l'écran Écrire, « Besoin d'une idée ? » propose un sujet, un point de grammaire
N4, N3 ou N2 (selon Réglages → Niveau visé) à placer (avec exemple) et trois mots de vocabulaire. Dans la carte ouverte, « Changer » à côté de la grammaire ou des mots
ne change que cette partie (le sujet reste) et ne reprend pas ce qui vient d'être proposé aujourd'hui ; « Tout changer » en tire une
idée entière nouvelle ; « Retirer le sujet » l'enlève. Le contenu est dans `src/prompts/data.ts` et `src/prompts/more.ts` (une centaine de points N4, N3 et N2)
(à compléter librement, le balisage `{漢字|かんじ}` est le même que pour la correction) ;
`src/prompts/pick.ts` choisit en évitant les points déjà vus dans les 14 dernières entrées.
Le point visé est transmis à la correction, qui dit s'il a été bien employé.

### Écrire à une main

Sur l'écran Écrire, le compteur et le bouton « Corriger » sont dans une barre fixe en bas, juste au-dessus des onglets : ils restent
sous le pouce même quand la page défile. Quand le clavier du téléphone est ouvert, les onglets s'effacent et la barre reste
au-dessus du clavier ; dès que le clavier se ferme (même avec le geste « retour »), les onglets reviennent.
Tout ce qui se touche sur cet écran (pastilles de la semaine, carte « Idée du jour », « 思い出 », « Photos et autocollants »,
boutons « Changer ») fait au moins 44 px.

### Juste le thème
Dans la carte « Idée du jour », « Juste le thème » masque la grammaire et les mots pour la journée ; « Remettre mots et grammaire » les ramène. Ce jour-là, les mots n'entrent pas dans les statistiques, la correction ne reçoit que le sujet et le défi de traduction est libre.

### Retour arrière
Le geste « retour » d'Android revient à l'écran précédent (onglet ou entrée ouverte depuis l'Historique) au lieu de quitter l'appli.

### Aide (« Besoin d'aide ? »)

Un bouton « Aide » est toujours dans la barre du bas, entre le compteur et « Corriger ». Il ouvre une feuille de trois lignes (jamais évaluées, jamais d'effet sur ton texte) :

- **訳 Comment dit-on… ?** : tu écris une phrase ou une expression en français (200 caractères au plus) ; Claude rend une à trois façons de la dire en japonais, avec la lecture et un niveau approximatif (« N4 · poli », « N3 · plus soutenu »). « Ajouter à l'entrée » place la phrase à la fin de ton entrée (sur une nouvelle ligne si l'entrée n'est pas vide), curseur après, et ferme la feuille.
- **困 Je bloque** : en deux étapes, à ton rythme. Étape 1 : une question guidée en français. Étape 2 : une amorce en japonais avec son sens. « Écrire à partir de là » l'ajoute à ton entrée ; « Arrêter » ferme tout sans toucher au texte, à chaque étape. Un seul appel à l'ouverture donne la question et l'amorce : l'étape 2 est locale. La fin de ton entrée sert de contexte pour ne pas répéter ce que tu as écrit.
- **書 Amorces de phrase** (seulement tant que l'entrée est vide) : ouvre la rangée d'amorces d'avant (début de phrase en japonais, sens en français), adaptées au thème du jour. Un tap insère l'amorce, place le curseur à la fin et referme la rangée. Les amorces sont dans `src/prompts/starters.ts` : aucun appel API.

Les appels utilisent le modèle léger d'abord, puis le modèle principal s'il échoue, et sont comptés dans le mois (« coups de pouce » et « Comment dit-on… ? » dans Réglages → consommation). Sans clé API, sans réseau ou en cas d'échec : un message lisible, le texte reste intact. Rien n'est gardé : ni sauvegarde ni réglage de plus. Code : `src/components/HelpSheet.tsx`, `src/unblock.ts`, `src/say.ts`, `src/aiTool.ts`.

### Lien entre sujet, mots et grammaire

- Les mots de ton deck sont choisis en priorité s'ils ont un rapport avec le sujet du jour (mots-clés français et kanji par thème, `src/prompts/themes.ts`).
- Dès qu'une idée est tirée, Claude écrit en arrière-plan un défi de traduction qui relie le sujet, le point de grammaire et des mots du jour (`src/link.ts`, outil `submit_link`). Il s'affiche dans la carte, section « Défi de traduction », et se garde avec l'entrée ; un bouton permet de le redemander s'il a échoué ou si tu étais hors ligne. Il n'y a plus de phrase d'exemple « Tout ensemble » (retirée au Sprint 5, les anciennes ne sont plus affichées).
- Les mots du jour sont cochés pendant que tu écris (`src/words.ts`, la forme conjuguée compte). Les statistiques gardent combien de fois chaque mot a été proposé et employé ; ceux jamais employés reviennent plus souvent, ceux déjà employés moins.

### Une question sur la correction

Sous une correction ouverte, le bouton « Une question ? » ouvre un fil (dans une faute dépliée, « Une question sur cette faute ? » l'ouvre avec la faute rappelée en haut ; le « × » la retire pour poser une question sur toute la correction). Tu poses ta question en français (300 caractères au plus) ; Claude connaît ton entrée, la version plus naturelle, les fautes corrigées et la grammaire, et répond en français avec jusqu'à trois exemples japonais (furigana selon ton niveau) et leur sens. Les échanges déjà faits sont renvoyés à chaque question pour que la suite ait du sens.

- Le fil compte au plus 3 échanges par correction (compteur « Échange 2 sur 3 »). Au dernier, une phrase explique que le plafond garde les coûts bas, avec un lien vers Réglages. Réglages → « Échanges par correction » (de 1 à 5, 3 par défaut) ; si tu l'abaisses sous le nombre d'échanges déjà faits, tu peux les relire mais plus en ajouter.
- Le fil est rangé dans la correction de l'entrée (`correction.thread`) : il suit la sauvegarde et la restauration, jamais la clé API. Plus tard (Écrire ou Historique), il se relit replié : « Questions sur cette correction · 3 échanges ». Refaire la correction repart d'un fil vide.
- Modèle léger d'abord, modèle principal s'il échoue ; chaque appel est compté dans le mois (« questions sur la correction »). Sans clé API, le bouton n'est pas proposé. En cas d'échec ou sans réseau : un message lisible, la question reste dans le champ et aucun échange n'est compté.
- Code : `src/components/CorrectionThread.tsx`, `src/ask.ts` (requête), `src/thread.ts` (enregistrement).

### Après la correction

Sous la correction : une « phrase bonus » proposée par Claude (dans le même appel que la correction, champ `bonus`), à ajouter à l'entrée d'un geste, puis une « révision éclair » : une question tirée de tes fautes des autres jours (`src/components/AfterCorrection.tsx`, même historique que le quiz des Stats).

### Succès

Un troisième onglet de Stats, « Succès », liste 20 petites victoires (catalogue validé : décision D31) : jours écrits, séries, caractères, points de grammaire bien placés, premier bilan, quiz, conjugaison, page décorée… Chaque succès débloqué montre sa date ; chaque succès à venir montre sa condition et ta progression (« 26 / 30 »). Rien ne se calcule hors de tes données : tout vient des entrées, bilans, quiz et conjugaisons déjà gardés (`src/achievements.ts`, fonction pure testée sur ta vraie sauvegarde).

- Un succès débloqué ne se perd jamais, même si une série se met en pause ou si une entrée est supprimée (déblocages gardés dans les réglages, hors sauvegarde).
- À la première ouverture et après une restauration de sauvegarde, les succès déjà mérités sont attribués sans célébration.
- Les dates des succès « quiz » et « conjugaison » sont approchées (le dernier jour de réponse), faute d'historique réponse par réponse.

### Célébration d'un succès

Quand un nouveau succès se débloque, une carte discrète s'affiche une fois : « Succès débloqué », son nom et sa condition. Elle se ferme d'un tap ou seule au bout de 4 secondes, ne s'affiche jamais pendant que tu tapes (elle attend que tu quittes le champ), passe en file s'il y en a plusieurs, et reste immobile si le téléphone réduit les animations (`src/components/Celebration.tsx`).

### Correction courte ou complète

Réglages → Correction. « Complète » (par défaut) : chaque faute avec ses explications, l'encouragement, la grammaire bien placée et à revoir, la phrase bonus. « Courte » : l'encouragement, la faute, sa correction et une phrase d'explication, plus les points bien employés ; elle n'envoie plus le contexte, l'autre emploi, les points à revoir ni la phrase bonus, et demande une réponse plus petite. Le choix s'applique à la prochaine correction ; les anciennes gardent leur forme. Le coût d'une correction et le coût mensuel (une par jour) sont affichés pour les deux choix : mesurés d'après ta consommation dès 2 appels de chaque sorte, estimés avant (complète ≈ 0,027 $, courte ≈ 55 % de cela). Les corrections courtes sont comptées à part dans Consommation de l'API.

### Série douce

Règle (décision D27) : un jour sans entrée ne change rien ; deux jours entiers de suite sans entrée mettent la série « en pause » (le nombre est gardé et affiché). La prochaine entrée repart à 1. Le record n'est jamais effacé et aucun message ne parle d'échec. Seuls les jours écrits comptent. Le calcul est dans `streakInfo` (`src/stats.ts`) ; la mention « en pause » apparaît sur Écrire, Stats et Historique, et Stats affiche « record N » quand la série en cours est plus courte.

### Message de reprise

Après une pause (au moins deux jours sans entrée), l'écran Écrire affiche une seule fois par retour : « Content de te revoir. Deux phrases suffisent pour aujourd'hui. » Il ne compte pas les jours manqués. « Écrire deux phrases » met le curseur dans l'entrée, « Plus tard » le range ; il reste en place pendant qu'on écrit pour que l'écran ne saute pas (`src/components/WelcomeBack.tsx`, mémorisé hors sauvegarde dans localStorage).

### Écrire un jour passé

Déjà possible (flèches de date, ronds de la semaine, balayage) : l'entrée est enregistrée sous la date choisie, garde son vrai moment d'écriture (`createdAt`) et comble le trou dans la série et les statistiques. Rien n'est affiché pour distinguer ces entrées pour l'instant.

### Série et grammaire placée

L'écran Écrire montre les sept derniers jours en ronds (plein = une entrée écrite ; toucher un rond ouvre ce jour) et la série en cours. L'Historique ajoute le record et le nombre de points de grammaire jugés « bien employés » par les corrections (`src/stats.ts`). Les idées du jour proposent trois fois plus souvent un point jamais bien employé.

### Statistiques

L'onglet Stats (`src/pages/StatsPage.tsx`) résume l'écriture (jours, série, caractères), les caractères par mois, les erreurs par type avec leur évolution semaine par semaine (fautes pour 100 caractères, jours écrits), les mots du jour employés, et la grammaire bien placée ou à revoir. Tout est calculé sur le téléphone à partir des entrées et des corrections.

### Bilan de la semaine

Dans l'onglet Stats, « Faire le bilan » envoie à Claude les entrées des 7 derniers jours (texte, erreurs relevées, comparaison avec les trois semaines d'avant) et rend : un résumé, les erreurs qui reviennent, ce qui progresse, et un point de grammaire à viser (`src/review.ts`). Les bilans sont gardés sur le téléphone (les 12 derniers). Le point visé devient la première idée du jour pendant 3 jours, ou jusqu’à ce qu’il ait été bien employé une fois.

### Revoir ses erreurs (quiz)

Dans Exercices : 5 questions tirées des erreurs corrigées (ta phrase avec un blanc, quatre formes à choisir). **Les fautes des 7 derniers jours passent en premier** (jour de l'entrée la plus récente où la faute apparaît) ; une faute récente déjà réussie aujourd'hui ne passe plus devant. Quand il n'y a plus de faute récente, le tirage est celui d'avant : types d'erreurs fréquents et erreurs ratées en priorité, celles réussies hier moins (`src/quiz.ts`, `buildQuiz` avec `recentFrom`). Même règle dans la carte « après la correction » et dans « J'ai 2 minutes ». Aucun appel à l'API.

### Exercices de particules

Dans Stats : 10 questions « quelle particule ? ». Les fautes de particule corrigées dans tes entrées passent en premier (`src/particles.ts` repère la particule changée par la correction) ; le reste vient d'une liste d'une trentaine de verbes à particule fixe (`会う → に`, `緊張する → に`…), à compléter dans ce même fichier. Les réponses alimentent le même historique que le quiz.

### Retirer une question

Sous chaque question du quiz, des exercices et de la révision éclair : « Retirer cette question ». Elle ne revient plus (drapeau `hidden` dans l'historique du quiz, gardé dans la sauvegarde).

### Réécrire sans regarder

Sous la correction : tu retapes ton texte corrigé de mémoire, l'appli compare caractère par caractère (ponctuation ignorée) et marque en rouge ce qui est faux, en vert ce qu'il fallait écrire (`src/rewrite.ts`).

### Entrées non corrigées

L'Historique marque « pas corrigée » les entrées sans correction, avec un bouton « Corriger maintenant ».

### Consommation de l'API

Chaque appel ajoute ses jetons (envoyés / reçus, par type d'appel et par mois) à un compteur local ; Réglages → « Consommation de l'API » montre l'estimation en dollars du mois en cours et du mois dernier (tarif Sonnet 5.5 dans `src/usage.ts`, à ajuster si le modèle change). Le compteur n'est pas dans la sauvegarde. Un plafond du mois (2,50 $ par défaut, modifiable dans les mêmes réglages) alimente la barre de consommation ; à 80 %, un message doux s'affiche une seule fois par mois (`src/components/CapNotice.tsx`). Rien n'est jamais bloqué.

### Copier pour Claude (bilan sans API)

Dans Stats → Bilans, « Copier pour Claude » met dans le presse-papiers tes entrées avec leurs corrections et les consignes du bilan,
à coller dans une conversation avec Claude : un bilan sans appel à l'API.
- Par défaut, la copie va **du lendemain du dernier jour déjà copié jusqu'à aujourd'hui** (la première fois : les 7 derniers jours).
  Le dernier jour copié est gardé sur le téléphone (réglage `reviewExport`, hors sauvegarde). Il n'avance que quand tu copies, jamais en arrière,
  et « Faire le bilan » (qui utilise l'API) ne le déplace pas.
- « Choisir les dates » : deux dates au choix, avec le nombre d'entrées et la taille du texte ; un avertissement s'affiche si le texte est très long.
- S'il n'y a rien de nouveau, le bouton est grisé et le dit.
- La clé API n'est jamais dans le texte copié.

### J'ai 2 minutes (série mélangée)

Une série de 5 questions sans aucun réglage, mélange de « Revoir mes erreurs » (dès 3 erreurs corrigées), conjugaison (si un deck Anki est importé), particules et transitif / intransitif,
jamais deux du même type de suite quand c'est possible ; s'il manque un type, les autres le remplacent. Les réponses vont dans les mêmes
historiques que les exercices habituels (`src/components/MixedSeries.tsx`, tirage dans `src/mixed.ts`) : quitter en cours ne fait rien perdre.
Le bouton est collé en bas de l'écran Exercices ; la ligne « Révision » de la carte « Aujourd'hui » lance la même série.

### Carte « Aujourd'hui »

Sur Écrire (jour courant), sous la bande de la semaine : deux lignes à toucher, sans rouge ni retard.
Thème montre le sujet du jour (ou propose une idée) ; Révision lance « J'ai 2 minutes » et affiche une petite coche ✓
(« Fait aujourd'hui ») dès qu'une série a été terminée aujourd'hui. Quitter une série en cours ne donne pas la coche.
Le jour de la dernière série terminée est gardé sur le téléphone (réglage `twoMinutes`, hors sauvegarde).

### Défi de traduction

Une phrase en français à traduire en japonais pour commencer l'entrée (champ `challenge` de l'idée), demandée à Claude par `src/link.ts` dans une seule requête avec :
- **le pont** (`bridge`) : une courte phrase (70 caractères au plus, deux lignes au plus à l'écran) qui montre comment placer le point de grammaire et un mot dans le thème ; affiché au-dessus du défi, dans la carte ouverte. Jamais demandé avec « Juste le thème » ;
- **`fits`** : faux quand le lien serait forcé. L'appli change alors de sujet (une seule fois par jour, et seulement pour une nouvelle idée ou « Tout changer », pas pour « Changer » les mots ou la grammaire) plutôt que de forcer. Si le second sujet n'a pas de lien non plus, le défi s'affiche sans pont.

### Modèle léger

Le défi est demandé à un modèle plus léger (Réglages → « Modèle léger », `claude-haiku-5-5` par défaut, environ 20 fois moins cher) ; s'il échoue, le modèle principal prend le relais. La correction et le bilan restent sur le modèle principal. Le compteur de coût applique le tarif de chaque modèle (`src/usage.ts`).

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
  aiTool.ts          appel d'un outil Claude : modèle léger d'abord, puis principal
  say.ts, unblock.ts « Comment dit-on… ? » et « Je bloque » (feuille Aide)
  ask.ts, thread.ts  questions sur une correction : requête, enregistrement du fil
  quiz.ts            mini-quiz d'erreurs
  transitivity.ts    paires 自動詞 / 他動詞 et exercices
  conj/              moteur de conjugaison, verbes du deck, révision espacée
  backup.ts          sauvegarde, import, rappel hebdomadaire
  image.ts           réduction des photos
  anki.ts            lecture des exports Anki (.txt) et fusion
  prompts/           contenu et tirage des idées du jour, amorces de phrase
  components/        vue de la correction, note d'idée
  types.ts           types, réglages par défaut (seuil furigana, niveau)
  pages/             Écrire, Historique, Stats, Réglages
public/              icônes PWA
vite.config.ts       manifest PWA + service worker
```
