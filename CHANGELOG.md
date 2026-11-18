# Journal des changements

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
