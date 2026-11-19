# Journal des changements

## Sprint 5 : écrire à une main (2026-11-18)

- S18.1 : audit à une main des écrans (largeur d'un S25). Constats et suites dans Notion : S18.4 (cibles de 44 px sur Historique, Stats, Exercices) et S18.5 (rappel de sauvegarde compact) ajoutées au backlog ; flèches de jour refusées (le balayage existe).
- S18.2 : sur Écrire, le compteur et « Corriger » sont dans une barre fixe en bas ; clavier ouvert, les onglets s'effacent et la barre reste au-dessus du clavier (les onglets reviennent dès que le clavier se ferme). Pastilles de la semaine, carte « Idée du jour », « 思い出 » et « Photos et autocollants » passent à 44 px minimum.
- S4.2 : amorces de phrase adaptées au thème du jour, **sur demande seulement** (bouton « Amorces » dans la barre du bas, entrée vide) : une rangée de trois amorces qui défile, un tap l'insère et place le curseur à la fin. Première version renvoyée par Kora : trop de place prise quand elles s'affichaient d'elles-mêmes (décision D36).
- S5.1 : « Changer » séparé pour la grammaire et pour les mots (le sujet reste) ; ce qui vient d'être proposé aujourd'hui ne revient pas ; « Tout changer » remplace « Autre idée ».
- Phrase d'exemple « Tout ensemble » retirée de la carte « Idée du jour » (décision D37) : le défi de traduction suffit. Claude ne la demande plus : la demande en arrière-plan ne produit que le défi (réponse limitée à 300 jetons au lieu de 800), donc moins chère qu'avant. Les anciennes phrases gardées dans les entrées ne sont plus affichées ; rien n'est supprimé des données.
- Coût API : 0 $ pour la barre, l'audit et les amorces. « Changer » relance en arrière-plan le défi de traduction, comme « Autre idée » le faisait déjà pour la phrase d'exemple (par tap, moins cher qu'avant puisque la demande est plus courte).
- Données : l'idée du jour garde, en plus, `prevGrammar` et `prevWords` (facultatifs). Le format des sauvegardes ne change pas : une ancienne sauvegarde s'importe comme avant.

## Sprint 4 : succès et correction à ta mesure (2026-11-18)

- S7.2 : onglet « Succès » dans Stats, avec 20 succès (décision D31). Chaque succès débloqué a sa date ; chaque succès à venir montre sa condition et ta progression. Tout est calculé d'après les données déjà gardées : sur ta sauvegarde du 18/11, 10 succès sont déjà débloqués. Un succès débloqué ne se perd jamais.
- S7.6 : célébration discrète d'un nouveau succès, une seule fois, fermée d'un tap ou seule après 4 s, immobile si le téléphone réduit les animations. Jamais pendant que tu tapes, jamais pour les succès déjà mérités (première ouverture, restauration d'une sauvegarde).
- S3.5 : Réglages → Correction : complète ou courte, avec le coût par correction et par mois pour chaque choix. La correction courte ne demande plus le contexte, l'autre emploi, les points à revoir ni la phrase bonus.
- Coût API : la correction courte coûte environ la moitié d'une complète (estimation à confirmer : l'appli la mesure dès 2 corrections courtes). La correction complète ne change pas. Les succès n'appellent jamais l'API.
- Nouvelles données : `correctionMode` dans les réglages (« complète » si absent d'une ancienne sauvegarde) ; déblocages des succès gardés hors sauvegarde (recalculés d'après les données après une restauration). Le format des sauvegardes ne change pas.

## Sprint 3 : une série qui n'est jamais punitive (2026-11-18)

- S7.1 : série douce (D27). Un jour sauté ne change rien ; deux jours entiers sautés mettent la série « en pause » (nombre gardé, mention « en pause » sur Écrire, Stats et Historique). La reprise repart à 1, le record reste (« record N » dans Stats). Seuls les jours écrits comptent.
- S17.3 : message de reprise après une pause, affiché une seule fois par retour, sans compter les jours manqués : « Content de te revoir. Deux phrases suffisent pour aujourd'hui. »
- S17.1 (spike) : écrire un jour passé fonctionne déjà. L'entrée garde la date choisie et son vrai moment d'écriture, et comble le trou de la série. Aucun code ajouté ; une éventuelle mention « écrit le … » reste à décider.
- S17.2 (créneau de routine) écartée sur ta décision (D26).
- Aucun appel API de plus (0 $). Aucun changement de la base ni du format de sauvegarde ; seule nouveauté de stockage : un repère du message de reprise, hors sauvegarde (localStorage).

## Sprint 2 : une correction qui explique et qui encourage (2026-11-18)

- S3.1 : chaque faute explique pourquoi c'est faux, dans quel contexte le mot ou la forme est impossible et dans quel autre cas on pourrait l'employer. Les blocs sans objet sont omis plutôt que remplis de généralités. Les anciennes corrections s'affichent comme avant (une seule explication).
- S3.2 : la correction commence par un encouragement en français, qui cite une phrase ou une tournure réelle de l'entrée. Il reste visible même quand la correction est repliée.
- S3.3 : les explications d'une faute sont repliées ; un tap sur la faute les déplie, et « Tout déplier / Tout replier » est en tête de la liste des fautes.
- S3.4 : Réglages → Consommation de l'API montre le coût du mois en dollars (décision D22) sur un plafond modifiable (2,50 $ par défaut), avec une barre ; à 80 % un message doux s'affiche une seule fois par mois, sans jamais bloquer l'écriture ni la correction.
- Coût API : environ +500 jetons de réponse par correction (estimation, à mesurer sur le téléphone). Le modèle de correction ne change pas.
- Nouvelle donnée : `monthlyCap` dans les réglages (valeur par défaut si absente d'une ancienne sauvegarde). Les corrections gardent leurs anciens champs ; `praise`, `context` et `otherUse` sont facultatifs.

## Sprint 1 : ranger l'écran Stats (2026-11-18)

- S2.1 : les cinq chiffres clés (jours écrits, jours de suite, caractères écrits, fautes pour 100 caractères, mots utilisés) sont visibles dès l'ouverture de Stats, sans défiler. « Record de série », « par entrée » et « corrigées » ne sont plus affichés ici (le record reste dans l'Historique).
- S2.2 : Stats a deux onglets, Progrès et Bilans ; les exercices ont leur propre onglet principal « Exercices » (décision D17). L'onglet de Stats ouvert est mémorisé.
- S2.3 : le bilan de la semaine est replié par défaut, avec une ligne qui donne la semaine concernée (affichée une seule fois). Les boutons « Faire / Refaire le bilan » et « Copier la semaine pour Claude » restent accessibles quand le bilan est replié (retour de la revue du 18/11).
- S2.4 : un « ? » explique chaque chiffre clé et chaque graphique.
- Aucun changement de la base ni du format de sauvegarde. La seule nouvelle donnée est l'onglet mémorisé, gardé hors sauvegarde (localStorage).
