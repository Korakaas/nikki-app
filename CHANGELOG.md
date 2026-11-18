# Journal des changements

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
