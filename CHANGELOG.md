# Journal des changements

## Lot 5 : format du jour, banque de textes, point du jour (2026-11-25)

- S5.4a « Un format d'écriture différent chaque jour » (5 points) : sous le thème du jour, un bloc « Format du jour » donne un format (日記 journal libre, 手紙 lettre, 感想 avis, 会話 dialogue, 描写 description, 意見 opinion), sans rien à choisir. Le format ne dépend que de la date : le même toute la journée, jamais le même deux jours de suite, les six passent à tour de rôle dans un ordre mélangé. Chaque format a une consigne, une mise en situation tirée de la banque de textes (la lettre à laquelle répondre, la scène à décrire, la question sur ta vie…), une aide en français cachée derrière un appui, et deux amorces qui s'insèrent seulement si la page est vide. Le journal libre n'a pas de texte : le thème du jour suffit. Le bloc se replie (le choix est gardé). Écrire autre chose reste toujours possible. Coût API : 0 €.
- Banque de textes : la première, décembre 2026 (30 textes, 6 par format hors journal libre), est dans `src/prompts/situations.ts`. Chaque mois, Kora demande une nouvelle banque : elle est ajoutée à la suite, les anciens textes ne bougent pas de place, et une banque finie recommence au premier texte (rien ne bloque). Les textes sont aussi gardés dans les documents du projet Claude (`banque-textes/`).
- S5.4b « Le format suit l'entrée et la correction » (3 points) : l'entrée garde son format (champ facultatif `format`) ; la demande de correction ajoute une ligne de contexte (« une lettre : registre poli attendu », etc.) pour comprendre l'intention, sans jamais juger le respect du format (le journal libre n'ajoute rien) ; l'Historique montre une petite étiquette du format sur l'entrée ouverte (pas pour le journal libre ni les anciennes entrées). Coût API : 0 € de plus (une ligne en plus dans la demande).
- S8.1a « Point du jour et phrases à trous » (5 points) : dans Exercices, un bloc « Point du jour » propose trois phrases à compléter au clavier japonais. Chaque point de grammaire n'ayant qu'un exemple, les trois phrases viennent de trois points : celui du jour (liste intégrée selon ta difficulté, ton deck Anki, ou le point visé par ton bilan), un point à revoir s'il y en a un, puis un autre. La phrase d'exemple est reprise avec le passage de grammaire caché (la fin polie fait partie du blanc ; la forme simple est acceptée aussi). Sens du point en français, traduction de la phrase, « Indice » (montre le point), « Passer ». Une bonne réponse est saluée ; une erreur montre la bonne forme et la phrase complète, sans note. Les trois phrases de la journée sont gardées (elles ne changent pas si tu rouvres l'appli) ; « Encore 3 phrases » en tire d'autres. Aucun appel à l'API : 0 €.
- S8.1b « Les erreurs nourrissent la révision » (3 points) : une erreur (ou une bonne réponse avec l'indice) est enregistrée dans l'historique des exercices (clé `gf|`), jamais dans les statistiques d'écriture ni dans la série. Un point raté revient dès le lendemain comme « À revoir », jusqu'à ce qu'il soit réussi ; réussi, il s'espace de plus en plus. « Passer » n'enregistre rien. Aucune note ni compteur d'échecs affiché.
- Données : champ facultatif `format` sur les entrées, et deux clés de réglages internes (`fill-day`, la série du jour) qui ne sont pas dans la sauvegarde. Le format des sauvegardes ne change pas (version 2) ; les anciennes sauvegardes s'importent sans rien changer.

## Hors lot : stockage protégé, S16.4 (2026-11-25)

- S16.4 « Stockage protégé du nettoyage automatique » (1 point) : à chaque ouverture, l'appli demande à Chrome de protéger ses données (entrées, photos, réglages) du nettoyage automatique quand le téléphone manque de place. Chrome répond seul, sans fenêtre ni notification ; il l'accorde surtout à une appli installée et ouverte souvent, donc « non » les premiers jours est normal. L'essai de Réglages → Sauvegarde affiche l'état (« Stockage protégé du nettoyage : oui / non »). Ça ne remplace pas la sauvegarde hebdomadaire : vider les données de l'appli ou la désinstaller efface toujours tout. Coût API : 0 €. Données : rien ne change.

## Lot 4 : difficulté, entraînement lié aux fautes, budget visible, essai de sauvegarde (2026-11-25)

- S5.3 « Curseur de difficulté » (3 points) : Réglages → Écriture → Difficulté, trois positions N3 / Mixte / N2, **Mixte par défaut**. Il remplace l'ancien réglage « Niveau visé ». Il joue sur (1) la grammaire du jour : N3 = un point N4 sur quatre pour consolider, Mixte = surtout du N3 avec un peu de N4 et de N2, N2 = N3 et N2 ; (2) les mots du jour : N3 préfère les mots N4, N2 préfère les N3, Mixte prend tout (la liste intégrée n'a pas encore de mots N2 ; les mots de ton deck Anki ne changent pas) ; (3) la longueur des phrases japonaises que Claude écrit (courtes, moyennes, un peu plus longues) et les points proposés par le bilan. Anciennes sauvegardes : N2 devient N2, N4 devient N3, N3 (l'ancienne valeur par défaut) devient Mixte. Coût API : 0 € (le texte envoyé change un peu, pas le nombre d'appels).
- S8.3 « Faute de grammaire → exercice » (5 points) : dans une correction, sous la faute dépliée, un bouton « S'entraîner » ouvre trois questions sur le même point : pour une faute de particule, ta faute d'abord puis des verbes qui demandent la même particule ; pour une confusion transitif / intransitif, la paire de verbes. Pas d'exercice lié (registre, conjugaison, naturel…) : pas de bouton. Les réponses s'ajoutent à l'historique des exercices, jamais aux statistiques d'écriture ni à la série. Aucun appel à l'API : 0 €.
- S12.3 « Budget visible par fonction » (3 points) : nouveau bloc « Budget du mois » dans Réglages, toujours visible : total du mois sur le plafond avec sa barre, puis le coût par fonction (Correction, Idées et coups de pouce, Discussion sur la correction, Bilan ; « Autres » seulement s'il y en a) avec le nombre d'appels, le mois dernier, et le plafond modifiable. La somme des lignes est toujours égale au total des appels comptés. L'ancienne ligne « Consommation » est remplacée. Le plafond reste en dollars comme avant.
- S16.1 « Spike : sauvegarde automatique » (2 points) : voir la décision dans Notion. Résumé : Chrome sur Android sait maintenant choisir un fichier ou un dossier où écrire (depuis Chrome 132), mais chaque choix demande un tap, et rien n'assure que l'autorisation reste sans tap après la fermeture de l'appli. Pour le vérifier sur ton téléphone : Réglages → Sauvegarde → « Essai : sauvegarde automatique » (écrit seulement un petit fichier « nikki-essai », jamais tes entrées). En attendant, la solution reste le rappel hebdomadaire et le partage en un tap (S16.2).
- Données : champ facultatif `difficulty` dans les réglages (absent = déduit de l'ancien niveau visé) ; le format des sauvegardes ne change pas (version 2), les anciennes sauvegardes s'importent sans rien changer. La clé API n'y est toujours pas.

## Lot 3 : Stats, Bilans et tampons de professeur (2026-11-24)

- Retouches demandées par Kora après essai (même jour) : le « Thème du jour » se replie complètement (plus de version à 3 lignes, seulement le titre ; le choix est gardé) ; le tampon de l'entrée est en haut à droite du texte, juste sous le thème du jour.

- S18.17 « Stats en blocs » (3 points) : onglets Progrès, Bilans et Succès en haut de l'écran ; chaque section est un bloc avec sa pastille et son « ? » ; Mots du jour et Grammaire repliés ; graphiques aux couleurs des pastilles. Les cinq chiffres clés restent (jours, de suite, 文字, fautes pour 100 文字, mots).
- S18.18 « Bilans plus lisibles » (5 points) : bilan de la semaine replié, avec « Refaire le bilan » et « Copier pour Claude » en liens discrets ; déplié, il commence par ce qui progresse. Bilan du mois en quatre cartes comparées au mois d'avant, fautes par type en barres, trois listes. Une baisse n'est jamais rouge. Aucun appel à l'API de plus.
- S18.19 « Tampons de professeur » (5 points) : がんばりました (deux phrases écrites), よくできました (point de grammaire du jour bien employé), 花丸 (en plus, un mot du jour employé), 二分 (série « J'ai 2 minutes » faite). Un seul grand tampon par entrée, jamais d'après les fautes, sans son ni notification, jamais retiré. Posé sur la page dans Écrire et dans l'Historique ; petit sceau 添 pour les entrées corrigées ; 二分 sur l'encart des Exercices.
- Le bleu des anciens écrans est remplacé par l'encre neutre des palettes.
- Coût API : 0 € (aucun appel ajouté). Données : champ facultatif `stamp` sur les entrées ; le format des sauvegardes ne change pas (version 2), les anciennes sauvegardes s'importent sans rien changer.

## Lot 2 : Écrire, Historique et numéro de version (2026-11-24)

- La phrase bonus n'est plus demandée à Claude (D71) : la réponse de correction est un peu plus courte, donc un peu moins chère. Les anciennes corrections gardent leur phrase bonus dans les données et les sauvegardes.
- Historique : entrées resserrées (jour | aperçu | pastille et nombre de caractères sur la même ligne, environ 80 px au lieu de 200).
- Retouches demandées par Kora après essai (même jour) : une pastille 褒 devant l'encouragement ; dans la correction dépliée, les erreurs d'abord (explications dépliées), puis la version plus naturelle ; la grammaire est repliée (ligne « Grammaire … 1 ○ 1 △ ») ; la ligne « Une phrase bonus » disparaît de « Pour continuer ».

- S18.21 « Numéro de version » (1 point) : tout en bas de Réglages, « Version N · date · code ». N = nombre de commits, la date est celle de la construction (heure de Paris). Il est annoncé à chaque livraison pour vérifier que le téléphone a la bonne version. Le déploiement GitHub récupère tout l'historique pour que le compte soit juste.
- S18.14 « Correction en bloc » (3 points) : la correction devient un bloc rose ouvert d'un tap ; replié, il garde l'encouragement (une correction commence par ce qui est réussi) et un résumé « 2 erreurs · 1 ○ 1 △ ». Le texte corrigé n'est plus en bleu.
- S18.15 « Pour continuer » (2 points) : phrase bonus, réécrire sans regarder, révision éclair et conjugaison éclair sont rangées en lignes dans un seul bloc, sous la correction (il disparaît s'il n'y a rien à proposer). Chaque exercice marche comme avant.
- S18.16 « Historique par mois » (3 points) : bloc « En chiffres », entrées rangées par mois (le dernier mois ouvert, les autres repliés), deux lignes de texte, pastille 添 et nombre de caractères ; ouvrir une entrée donne la même vue qu'avant (texte, décor, correction, Modifier, Supprimer).
- S18.20 « Souvenir déplacé dans l'Historique » (1 point, décision D69) : « Il y a un mois, tu écrivais… » quitte l'écran Écrire et devient un bloc de l'Historique.
- Coût API : 0 € (aucun appel ajouté). Données : rien ne change, le format des sauvegardes reste celui d'avant (version 2).
- Lot suivant (pas encore commencé) : S18.17 (Stats), S18.18 (Bilans), S18.19 (tampons).

## Lot lisibilité : des blocs et des couleurs douces (2026-11-24)

- S18.10 « Palettes et pastilles » (3 points) : chaque section devient un bloc au cadre fin neutre, avec une petite pastille colorée (vert = écrire, rose = correction, 3ᵉ couleur = s'entraîner, gris = réglages). Le texte reste noir. Trois palettes au choix dans Réglages → Couleurs : « Matcha et sakura » (par défaut), « Fruits », « Canard » ; clair et sombre.
- S18.11 « Exercices en blocs » (2 points) : particules, conjugaison et transitif / intransitif en blocs, textes raccourcis et bouton « Lancer » comme sur la maquette ; « Revoir mes erreurs » passe en dernier ; « J'ai 2 minutes » reste tout en haut.
- S18.12 « Réglages en quatre groupes » (3 points) : Écriture, Cartes Anki, Claude (plié par défaut, ouvert tant qu'il n'y a pas de clé API), Sauvegarde. Lignes compactes « libellé … valeur › » comme sur la maquette ; un tap déplie le réglage dessous. Chaque réglage fonctionne comme avant.
- S18.13 « Thème du jour plié » (3 points) : le bloc est plié par défaut, en trois lignes (Sujet / Grammaire / Mots) ; déplié, une pastille par partie (題, 文法, 単語, 訳) et le défi de traduction se déplie. Plus aucun bouton visible : les actions (changer la grammaire, changer les mots, juste le thème, tout changer, retirer le sujet) sont dans un menu discret « ⋯ ».
- Coût API : 0 € (aucun appel ajouté). Données : `palette` facultatif dans les réglages (absent = Matcha) ; le format des sauvegardes ne change pas (version 2), la clé API n'y est toujours pas.
- Lot suivant : voir « Lot 2 » ci-dessus.

## Lot ergonomie : moins de bruit sur Écrire (2026-11-24)

- S18.6 « Barre du bas qui s'efface » (2 points) : quand l'entrée du jour est déjà corrigée et que le texte n'a pas changé, la barre du bas (compteur, « Aide », « Corriger de nouveau ») disparaît complètement. Elle revient dès que tu modifies le texte, et reste présente s'il n'y a pas de correction (ou si une correction est en cours, en attente ou en erreur).
- S18.8 « Fin de la carte Aujourd'hui » (2 points) : la carte « Aujourd'hui » de l'écran Écrire est retirée, sans remplacement. L'encart « J'ai 2 minutes » (5 questions, avec ✓ « Fait aujourd'hui ») devient le premier bloc de l'écran Exercices ; l'ancienne barre fixe en bas d'Exercices disparaît.
- S18.7 écartée (D55). S18.9 (lisibilité des écrans, étude avec maquettes) reste à faire : rien n'est codé tant que tu n'as pas validé les maquettes.
- Coût API : 0 € (aucun appel ajouté). Données : rien ne change, le format des sauvegardes reste celui d'avant (version 2).

## Sprint 10 : poser une question sur une correction (2026-11-23)

- S10.1 « Une question ? » (8 points) : un fil sous la correction, ouvert par un bouton ou par le lien d'une faute dépliée (la faute est alors rappelée). Réponse en français avec exemples japonais lisibles ; Claude connaît l'entrée, la correction et les échanges précédents.
- S10.2 « Plafond et compteur » (3 points) : « Échange n sur 3 », phrase d'explication au dernier échange, réglage « Échanges par correction » (1 à 5) dans Réglages.
- S10.3 « Échanges conservés » (3 points) : le fil est rangé dans la correction, relu replié sous elle (Écrire et Historique), compris dans la sauvegarde ; la clé API n'y est jamais.
- S7.3 (autocollants) retourne au backlog (D51).
- Coût API (modèle léger, mesuré sur des réponses simulées de 1 800 jetons envoyés et 350 reçus) : ≈ 0,0004 $ par échange, ≈ 0,0012 $ par fil de 3. Le modèle principal (secours) coûterait ≈ 0,007 $ par échange.
- Données : `thread` facultatif dans la correction, `threadLimit` dans les réglages (valeur absente = 3). Le format des sauvegardes ne change pas (version 2) ; les anciennes sauvegardes s'importent sans fil.

## Sprint 9 : de l'aide pour écrire (2026-11-20)

- Nouveau bouton « Aide » dans la barre du bas (compteur | Aide | Corriger), toujours visible, même quand il y a du texte. Il ouvre la feuille « Besoin d'aide ? » : Comment dit-on… ?, Je bloque, Amorces de phrase. Le bouton « Amorces » de la barre y est rangé (la rangée d'amorces fonctionne comme avant).
- S4.1 « Comment dit-on… ? » (8 points) : une phrase en français → une à trois formulations japonaises avec lecture et niveau approximatif ; un tap sur « Ajouter à l'entrée » la place à la fin de l'entrée.
- S4.3 « Je bloque » (5 points) : une question guidée, puis une amorce ; on peut s'arrêter à tout moment sans toucher au texte ; rien n'est évalué.
- Modèle léger d'abord, modèle principal en secours ; chaque appel est compté dans le mois (nouvelles lignes « coups de pouce » et « Comment dit-on… ? » dans la consommation).
- Coût API (mesuré avec le modèle léger) : environ 0,0001 $ par « Je bloque » (un seul appel pour les deux étapes), environ 0,00015 $ par « Comment dit-on… ? » ; moins de 0,05 $ par mois à 10 usages par jour.
- Données : rien de nouveau n'est gardé ; le format des sauvegardes ne change pas.

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
