# Journal des changements

## Sprint 8 : les erreurs d'abord (2026-11-20)

- S6.1 (réduite de 8 à 3 points, D46) : « Revoir mes erreurs » devient un quatrième type de question dans « J'ai 2 minutes » (dès 3 erreurs corrigées ; sinon la série se fait avec les trois autres types). Les réponses alimentent le même historique que le mini-quiz d'erreurs. Les anciens exercices restent dans l'onglet Exercices.
- S6.4 : les fautes des 7 derniers jours passent en premier (mini-quiz d'erreurs, carte « après la correction » et série de 2 minutes). Une faute récente déjà réussie aujourd'hui ne passe plus devant ; sans faute récente, le tirage reste celui d'avant. Vérifié sur ta sauvegarde du 18/11 : 6 fautes récentes sur 69, toujours posées avant les autres sur 300 tirages.
- S5.2 : le pont entre le thème et le mot ou la grammaire : une courte phrase au-dessus du défi (deux lignes au plus). Si Claude ne trouve aucun lien naturel, le sujet est changé une fois plutôt que de forcer.
- S6.3 « Encore 5 » : déjà couverte par S6.2 (Fait).
- Coût API : le pont s'ajoute à la requête du défi, sans appel de plus : environ 100 jetons d'entrée et 50 de sortie, soit moins de 0,0001 $ par idée au tarif du modèle léger. Un appel de plus seulement quand le lien est impossible (au plus un par jour). Le reste : 0 $.
- Données : `lastSeen` (jour de la faute la plus récente) calculé à la volée, rien de nouveau n'est gardé ; `bridge` et `fits` facultatifs dans le défi de l'idée du jour. Le format des sauvegardes ne change pas.

## Sprint 7 : un bilan sur mesure et deux minutes pour réviser (2026-11-20)

- S12.1 : « Copier pour Claude » (Stats → Bilans) remplace « Copier la semaine pour Claude » : par défaut du lendemain du dernier jour copié jusqu'à aujourd'hui (7 derniers jours la première fois), ou entre deux dates au choix, avec le nombre d'entrées, la taille et un avertissement si le texte est très long. Le dernier jour copié ne recule jamais ; « Faire le bilan » (API) ne le déplace pas.
- S6.2 : « J'ai 2 minutes » : 5 questions mélangées (conjugaison, particules, transitif / intransitif), sans réglage ; bouton fixe en bas de l'écran Exercices ; quitter garde les réponses déjà données ; sans deck Anki, pas de conjugaison. Décision D43.
- S1.1 : carte « Aujourd'hui » sur Écrire : Thème et Révision (la ligne Révision lance la série), 48 px par ligne, rien de rouge ni de « en retard ». Retouche demandée par Kora : pas de ligne « Entrée » (place perdue) ; une coche ✓ « Fait aujourd'hui » sur Révision quand une série a été terminée aujourd'hui.
- S16.2 : déjà couverte par l'existant, fermée.
- Coût API : 0 $ de plus (la copie et la série n'appellent jamais l'API).
- Données : nouveaux réglages `reviewExport` (dernier jour copié) et `twoMinutes` (dernier jour de série terminée), hors sauvegarde ; le format des sauvegardes ne change pas.

## Sprint 6 : tout se touche facilement (2026-11-19)

- S18.4 : Historique : toute la ligne d'une entrée (date, aperçu, compteur) ouvre l'entrée, pas seulement la date. Stats : les boutons « ? » se touchent sur 44 px (même apparence). Exercices : « Voir toutes les paires » fait 44 px.
- S18.5 : le rappel de sauvegarde tient sur une ligne de texte et une ligne de boutons (« Sauvegarder » ou « Télécharger », « Plus tard »). Le champ d'écriture est visible dès l'ouverture. « Plus tard » fonctionne comme avant.
- S5.5 : « Juste le thème » dans la carte « Idée du jour » : masque la grammaire et les mots pour la journée (« Remettre mots et grammaire » les ramène). Ce jour-là, les mots ne comptent pas comme « non utilisés » dans les stats, la correction ne reçoit que le sujet, et le défi de traduction est libre. Le mode est gardé dans l'entrée (`themeOnly`, facultatif) et survit à « Tout changer ».
- S18.3 : le retour arrière (geste Android) revient à l'écran précédent (Historique → Exercices → retour = Historique) au lieu de quitter l'appli. Mesures : changement d'onglet entre 0,09 et 0,22 s sur le test, aucune barre de défilement horizontale.
- Coût API : 0 $ de plus. Données : `themeOnly` facultatif dans l'idée du jour ; le format des sauvegardes ne change pas.

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
