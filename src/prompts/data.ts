/*
  Contenu des prompts du jour. Les textes japonais utilisent le balisage de furigana
  {漢字|かんじ} (voir furigana.tsx) : l'affichage filtre les lectures selon le réglage.
*/

import { MORE_GRAMMAR } from './more'

export type PromptLevel = 'N4' | 'N3' | 'N2'

export interface GrammarPoint {
  level: PromptLevel
  pattern: string
  /** Sens en français. */
  fr: string
  example: string
  exampleFr: string
}

export interface Topic {
  theme: ThemeId
  ja: string
  fr: string
}

export interface Word {
  level: PromptLevel
  ja: string
  reading: string
  fr: string
}

export type ThemeId =
  | 'repas'
  | 'meteo'
  | 'travail'
  | 'amis'
  | 'sortie'
  | 'sentiments'
  | 'maison'
  | 'loisirs'

const BASE_GRAMMAR: GrammarPoint[] = [
  // ---- N4 ----
  {
    level: 'N4',
    pattern: '〜ので',
    fr: 'parce que, comme (raison, ton poli)',
    example: '{雨|あめ}が{降|ふ}っているので、{家|いえ}にいました。',
    exampleFr: 'Comme il pleuvait, je suis resté(e) à la maison.',
  },
  {
    level: 'N4',
    pattern: '〜たり〜たりする',
    fr: 'faire tantôt ceci, tantôt cela',
    example:
      '{休|やす}みの{日|ひ}は、{本|ほん}を{読|よ}んだり、{映画|えいが}を{見|み}たりします。',
    exampleFr: 'Les jours de congé, je lis, je regarde des films, etc.',
  },
  {
    level: 'N4',
    pattern: '〜てから',
    fr: 'après avoir fait',
    example: 'ご{飯|はん}を{食|た}べてから、{散歩|さんぽ}に{行|い}きました。',
    exampleFr: 'Après avoir mangé, je suis allé(e) me promener.',
  },
  {
    level: 'N4',
    pattern: '〜ながら',
    fr: 'tout en faisant',
    example: '{音楽|おんがく}を{聞|き}きながら、{勉強|べんきょう}します。',
    exampleFr: "J'étudie en écoutant de la musique.",
  },
  {
    level: 'N4',
    pattern: '〜たことがある',
    fr: 'avoir déjà fait',
    example: '{京都|きょうと}に{行|い}ったことがあります。',
    exampleFr: "Je suis déjà allé(e) à Kyoto.",
  },
  {
    level: 'N4',
    pattern: '〜たほうがいい',
    fr: 'il vaut mieux',
    example: '{早|はや}く{寝|ね}たほうがいいです。',
    exampleFr: 'Il vaut mieux se coucher tôt.',
  },
  {
    level: 'N4',
    pattern: '〜かもしれない',
    fr: 'peut-être, il se peut que',
    example: '{明日|あした}は{雨|あめ}が{降|ふ}るかもしれません。',
    exampleFr: "Il se peut qu'il pleuve demain.",
  },
  {
    level: 'N4',
    pattern: '〜と思う',
    fr: 'je pense que',
    example: 'あの{店|みせ}のラーメンはおいしいと{思|おも}います。',
    exampleFr: 'Je pense que les ramen de ce restaurant sont bons.',
  },
  {
    level: 'N4',
    pattern: '〜ようにする',
    fr: "faire en sorte de, s'efforcer de",
    example: '{毎日|まいにち}、{野菜|やさい}を{食|た}べるようにしています。',
    exampleFr: "Je m'efforce de manger des légumes chaque jour.",
  },
  {
    level: 'N4',
    pattern: '〜ことにする',
    fr: 'décider de (par soi-même)',
    example: '{来月|らいげつ}から、ジムに{通|かよ}うことにしました。',
    exampleFr: "J'ai décidé d'aller à la salle de sport à partir du mois prochain.",
  },
  {
    level: 'N4',
    pattern: '〜ことになる',
    fr: 'il est décidé que (indépendamment de soi)',
    example: '{来年|らいねん}、{大阪|おおさか}に{引|ひ}っ{越|こ}すことになりました。',
    exampleFr: "Il a été décidé que je déménage à Osaka l'an prochain.",
  },
  {
    level: 'N4',
    pattern: '〜(よ)うと思う',
    fr: "avoir l'intention de",
    example: '{週末|しゅうまつ}は、{友達|ともだち}に{会|あ}おうと{思|おも}っています。',
    exampleFr: 'Ce week-end, je pense voir des amis.',
  },
  {
    level: 'N4',
    pattern: '〜そうだ（様子）',
    fr: "avoir l'air de",
    example: 'このケーキはおいしそうです。',
    exampleFr: "Ce gâteau a l'air délicieux.",
  },
  {
    level: 'N4',
    pattern: '〜そうだ（伝聞）',
    fr: "il paraît que (d'après ce qu'on a entendu)",
    example:
      '{天気予報|てんきよほう}によると、{明日|あした}は{寒|さむ}いそうです。',
    exampleFr: "D'après la météo, il paraît qu'il fera froid demain.",
  },
  {
    level: 'N4',
    pattern: '〜てくれる／〜てあげる／〜てもらう',
    fr: 'faire quelque chose pour quelqu’un, ou le recevoir',
    example: '{友達|ともだち}が{駅|えき}まで{送|おく}ってくれました。',
    exampleFr: "Mon ami(e) m'a accompagné(e) jusqu'à la gare.",
  },
  {
    level: 'N4',
    pattern: '〜すぎる',
    fr: 'trop',
    example: '{昨日|きのう}は{食|た}べすぎました。',
    exampleFr: "Hier, j'ai trop mangé.",
  },
  {
    level: 'N4',
    pattern: '〜やすい／〜にくい',
    fr: 'facile à / difficile à',
    example: 'この{靴|くつ}は{歩|ある}きやすいです。',
    exampleFr: 'Ces chaussures sont faciles pour marcher.',
  },
  {
    level: 'N4',
    pattern: '〜たら',
    fr: 'si, quand (condition)',
    example:
      '{時間|じかん}があったら、{買|か}い{物|もの}に{行|い}きたいです。',
    exampleFr: "Si j'ai le temps, j'aimerais aller faire du shopping.",
  },
  {
    level: 'N4',
    pattern: '〜のに',
    fr: 'alors que (regret, surprise)',
    example:
      '{勉強|べんきょう}したのに、テストは{難|むずか}しかったです。',
    exampleFr: "J'avais révisé, pourtant l'examen était difficile.",
  },
  {
    level: 'N4',
    pattern: '〜ために',
    fr: 'pour (but)',
    example: '{日本|にほん}へ{行|い}くために、お{金|かね}をためています。',
    exampleFr: "J'économise pour aller au Japon.",
  },
  {
    level: 'N4',
    pattern: '〜ば',
    fr: 'si (condition)',
    example: '{安|やす}ければ、{買|か}います。',
    exampleFr: "Si c'est bon marché, je l'achète.",
  },
  {
    level: 'N4',
    pattern: '〜なければならない',
    fr: 'devoir',
    example: '{明日|あした}は{早|はや}く{起|お}きなければなりません。',
    exampleFr: 'Demain, je dois me lever tôt.',
  },
  {
    level: 'N4',
    pattern: '〜てしまう',
    fr: 'finir par, regret',
    example: '{財布|さいふ}を{忘|わす}れてしまいました。',
    exampleFr: "J'ai oublié mon portefeuille (zut).",
  },

  // ---- N3 ----
  {
    level: 'N3',
    pattern: '〜ことがある',
    fr: 'il arrive que',
    example: '{夜|よる}、{眠|ねむ}れないことがあります。',
    exampleFr: 'Il m’arrive de ne pas pouvoir dormir la nuit.',
  },
  {
    level: 'N3',
    pattern: '〜ようになる',
    fr: 'en venir à, devenir capable de',
    example:
      '{最近|さいきん}、{日本語|にほんご}で{夢|ゆめ}を{見|み}るようになりました。',
    exampleFr: 'Ces derniers temps, je me suis mis(e) à rêver en japonais.',
  },
  {
    level: 'N3',
    pattern: '〜ように（目的）',
    fr: 'afin que, pour que',
    example: '{忘|わす}れないように、メモをとります。',
    exampleFr: 'Je prends des notes pour ne pas oublier.',
  },
  {
    level: 'N3',
    pattern: '〜はずだ',
    fr: 'devrait (attente logique)',
    example: '{彼|かれ}はもう{家|いえ}に{着|つ}いているはずです。',
    exampleFr: 'Il devrait déjà être arrivé chez lui.',
  },
  {
    level: 'N3',
    pattern: '〜わけではない',
    fr: "ce n'est pas que",
    example:
      '{嫌|きら}いなわけではありませんが、あまり{食|た}べません。',
    exampleFr: "Ce n'est pas que je n'aime pas, mais j'en mange peu.",
  },
  {
    level: 'N3',
    pattern: '〜ところだ',
    fr: 'être sur le point de, en train de',
    example: '{今|いま}、ご{飯|はん}を{食|た}べるところです。',
    exampleFr: 'Je suis sur le point de manger.',
  },
  {
    level: 'N3',
    pattern: '〜たばかりだ',
    fr: 'venir de',
    example: 'さっき{起|お}きたばかりです。',
    exampleFr: 'Je viens de me lever.',
  },
  {
    level: 'N3',
    pattern: '〜たびに',
    fr: 'chaque fois que',
    example:
      'この{歌|うた}を{聞|き}くたびに、{学生|がくせい}のころを{思|おも}い{出|だ}します。',
    exampleFr: "Chaque fois que j'écoute cette chanson, je repense à l'époque étudiante.",
  },
  {
    level: 'N3',
    pattern: '〜ても',
    fr: 'même si',
    example: '{雨|あめ}が{降|ふ}っても、{散歩|さんぽ}に{行|い}きます。',
    exampleFr: 'Même s’il pleut, je vais me promener.',
  },
  {
    level: 'N3',
    pattern: '〜せいで',
    fr: 'à cause de (résultat négatif)',
    example: '{寝不足|ねぶそく}のせいで、{頭|あたま}が{痛|いた}いです。',
    exampleFr: "À cause du manque de sommeil, j'ai mal à la tête.",
  },
  {
    level: 'N3',
    pattern: '〜おかげで',
    fr: 'grâce à (résultat positif)',
    example:
      '{友達|ともだち}のおかげで、{宿題|しゅくだい}が{早|はや}く{終|お}わりました。',
    exampleFr: "Grâce à mon ami(e), j'ai fini mes devoirs plus tôt.",
  },
  {
    level: 'N3',
    pattern: '〜について',
    fr: 'à propos de',
    example: '{旅行|りょこう}について、{友達|ともだち}と{話|はな}しました。',
    exampleFr: "J'ai parlé du voyage avec un(e) ami(e).",
  },
  {
    level: 'N3',
    pattern: '〜らしい',
    fr: 'il paraît que, typique de',
    example:
      '{駅|えき}の{前|まえ}に{新|あたら}しいカフェができたらしいです。',
    exampleFr: "Il paraît qu'un nouveau café a ouvert devant la gare.",
  },
  {
    level: 'N3',
    pattern: '〜っぽい',
    fr: 'avoir un côté, tirer sur',
    example: 'この{映画|えいが}は{子|こ}どもっぽいです。',
    exampleFr: 'Ce film fait assez enfantin.',
  },
  {
    level: 'N3',
    pattern: '〜みたいだ',
    fr: 'on dirait, comme',
    example: '{今日|きょう}は{春|はる}みたいに{暖|あたた}かいです。',
    exampleFr: "Aujourd'hui, il fait doux comme au printemps.",
  },
  {
    level: 'N3',
    pattern: '〜(さ)せてもらう',
    fr: 'faire avec la permission de quelqu’un',
    example: '{先生|せんせい}に{質問|しつもん}させてもらいました。',
    exampleFr: "J'ai pu poser une question au professeur.",
  },
  {
    level: 'N3',
    pattern: 'passif 〜(ら)れる',
    fr: 'subir une action',
    example: '{電車|でんしゃ}で{足|あし}を{踏|ふ}まれました。',
    exampleFr: "On m'a marché sur le pied dans le train.",
  },
  {
    level: 'N3',
    pattern: 'causatif 〜(さ)せる',
    fr: 'faire faire, laisser faire',
    example: '{母|はは}は{私|わたし}に{野菜|やさい}を{食|た}べさせます。',
    exampleFr: 'Ma mère me fait manger des légumes.',
  },
  {
    level: 'N3',
    pattern: '〜ことはない',
    fr: "il n'y a pas lieu de",
    example: '{心配|しんぱい}することはありませんよ。',
    exampleFr: "Il n'y a pas de quoi s'inquiéter.",
  },
  {
    level: 'N3',
    pattern: '〜ずに',
    fr: 'sans faire',
    example: '{朝|あさ}ごはんを{食|た}べずに、{家|いえ}を{出|で}ました。',
    exampleFr: 'Je suis sorti(e) sans prendre de petit-déjeuner.',
  },
  {
    level: 'N3',
    pattern: '〜に違いない',
    fr: 'sûrement, forcément',
    example: 'あの{人|ひと}は{忙|いそが}しいに{違|ちが}いありません。',
    exampleFr: 'Cette personne est sûrement occupée.',
  },
  {
    level: 'N3',
    pattern: '〜かどうか',
    fr: 'si ... ou non',
    example: '{行|い}けるかどうか、まだ{分|わ}かりません。',
    exampleFr: 'Je ne sais pas encore si je pourrai y aller.',
  },
  {
    level: 'N3',
    pattern: '〜てくる／〜ていく（変化）',
    fr: "évolution jusqu'à maintenant / à partir de maintenant",
    example: 'だんだん{寒|さむ}くなってきました。',
    exampleFr: 'Il fait de plus en plus froid.',
  },
  {
    level: 'N3',
    pattern: '〜間に',
    fr: 'pendant que (action ponctuelle)',
    example:
      '{母|はは}が{出|で}かけている{間|あいだ}に、{部屋|へや}を{掃除|そうじ}しました。',
    exampleFr: "Pendant que ma mère était sortie, j'ai fait le ménage de ma chambre.",
  },
  {
    level: 'N3',
    pattern: '〜うちに',
    fr: "tant que, avant que ça change",
    example:
      '{若|わか}いうちに、いろいろな{国|くに}へ{行|い}きたいです。',
    exampleFr: "Tant que je suis jeune, j'aimerais aller dans plein de pays.",
  },
  {
    level: 'N3',
    pattern: '〜ついでに',
    fr: 'en profitant de',
    example:
      '{買|か}い{物|もの}のついでに、{本屋|ほんや}に{寄|よ}りました。',
    exampleFr: 'En faisant les courses, je suis passé(e) à la librairie.',
  },
  // ---- N2 ----
  {
    level: 'N2',
    pattern: '〜にもかかわらず',
    fr: 'malgré, en dépit de',
    example:
      '{雨|あめ}にもかかわらず、たくさんの{人|ひと}が{来|き}ました。',
    exampleFr: 'Malgré la pluie, beaucoup de monde est venu.',
  },
  {
    level: 'N2',
    pattern: '〜に対して',
    fr: "envers, à l'égard de ; par contraste avec",
    example:
      '{私|わたし}は{姉|あね}に{対|たい}して、いつも{感謝|かんしゃ}しています。',
    exampleFr: 'Je suis toujours reconnaissant(e) envers ma grande sœur.',
  },
  {
    level: 'N2',
    pattern: '〜において',
    fr: 'à, dans (lieu, domaine, circonstance)',
    example:
      '{大会|たいかい}は{体育館|たいいくかん}において{行|おこな}われました。',
    exampleFr: 'Le tournoi a eu lieu au gymnase.',
  },
  {
    level: 'N2',
    pattern: '〜をきっかけに',
    fr: "à la suite de, à l'occasion de (déclic)",
    example:
      '{引|ひ}っ{越|こ}しをきっかけに、{自炊|じすい}を{始|はじ}めました。',
    exampleFr: 'Depuis mon déménagement, je me suis mis(e) à cuisiner.',
  },
  {
    level: 'N2',
    pattern: '〜わけにはいかない',
    fr: 'on ne peut pas (pour une raison morale ou pratique)',
    example:
      '{明日|あした}は{試験|しけん}なので、{今夜|こんや}は{遊|あそ}ぶわけにはいきません。',
    exampleFr: "Demain j'ai un examen, je ne peux pas me permettre de sortir ce soir.",
  },
  {
    level: 'N2',
    pattern: '〜ざるを得ない',
    fr: 'ne pas pouvoir faire autrement que de',
    example:
      '{台風|たいふう}で{電車|でんしゃ}が{止|と}まったので、{会社|かいしゃ}を{休|やす}まざるを{得|え}ませんでした。',
    exampleFr: "Le typhon a arrêté les trains, j'ai dû rester chez moi.",
  },
  {
    level: 'N2',
    pattern: '〜ものの',
    fr: 'bien que, certes… mais',
    example:
      '{買|か}ったものの、まだ{一度|いちど}も{使|つか}っていません。',
    exampleFr: "Je l'ai acheté, mais je ne m'en suis pas encore servi.",
  },
  {
    level: 'N2',
    pattern: '〜からには',
    fr: 'puisque, du moment que',
    example:
      'やると{決|き}めたからには、{最後|さいご}までがんばります。',
    exampleFr: "Puisque j'ai décidé de le faire, je m'y tiens jusqu'au bout.",
  },
  {
    level: 'N2',
    pattern: '〜次第',
    fr: 'dès que',
    example:
      '{駅|えき}に{着|つ}き{次第|しだい}、{連絡|れんらく}します。',
    exampleFr: 'Je vous contacte dès mon arrivée à la gare.',
  },
  {
    level: 'N2',
    pattern: '〜つつある',
    fr: 'être en train de (changement progressif)',
    example:
      '{町|まち}は{少|すこ}しずつ{変|か}わりつつあります。',
    exampleFr: 'La ville est en train de changer peu à peu.',
  },
  {
    level: 'N2',
    pattern: '〜かねない',
    fr: 'risquer de (conséquence négative)',
    example:
      '{寝不足|ねぶそく}が{続|つづ}くと、{仕事|しごと}で{失敗|しっぱい}しかねません。',
    exampleFr: 'Si le manque de sommeil continue, je risque de commettre une erreur au travail.',
  },
  {
    level: 'N2',
    pattern: '〜に限る',
    fr: "rien ne vaut, le mieux c'est",
    example:
      '{暑|あつ}い{日|ひ}は、{冷|つめ}たいアイスに{限|かぎ}ります。',
    exampleFr: 'Quand il fait chaud, rien ne vaut une glace.',
  },
  {
    level: 'N2',
    pattern: '〜ばかりか',
    fr: 'non seulement… mais aussi',
    example:
      '{彼|かれ}は{英語|えいご}ばかりか、{中国語|ちゅうごくご}も{話|はな}せます。',
    exampleFr: 'Il parle non seulement anglais, mais aussi chinois.',
  },
  {
    level: 'N2',
    pattern: '〜わりに',
    fr: "pour, compte tenu de (écart avec l'attente)",
    example:
      'この{店|みせ}は{安|やす}いわりに、とてもおいしいです。',
    exampleFr: 'Ce restaurant est très bon pour son prix.',
  },
  {
    level: 'N2',
    pattern: '〜通りに',
    fr: 'comme, conformément à',
    example:
      '{先生|せんせい}に{言|い}われた{通|とお}りに、{書|か}き{直|なお}しました。',
    exampleFr: "J'ai réécrit exactement comme le professeur me l'avait dit.",
  },
  {
    level: 'N2',
    pattern: '〜ことに',
    fr: "(sentiment) chose…, c'est que",
    example:
      '{残念|ざんねん}なことに、{旅行|りょこう}は{中止|ちゅうし}になりました。',
    exampleFr: 'Malheureusement, le voyage a été annulé.',
  },
  {
    level: 'N2',
    pattern: '〜に比べて',
    fr: 'comparé à',
    example:
      '{去年|きょねん}に{比|くら}べて、{今年|ことし}は{雨|あめ}が{多|おお}いです。',
    exampleFr: "Comparé à l'an dernier, il pleut plus cette année.",
  },
  {
    level: 'N2',
    pattern: '〜（よ）うとする',
    fr: 'essayer de, être sur le point de',
    example:
      '{家|いえ}を{出|で}ようとしたとき、{電話|でんわ}が{鳴|な}りました。',
    exampleFr: "Au moment où j'allais sortir, le téléphone a sonné.",
  },
  {
    level: 'N2',
    pattern: '〜ようがない',
    fr: "il n'y a aucun moyen de",
    example:
      '{連絡先|れんらくさき}が{分|わ}からないので、{連絡|れんらく}しようがありません。',
    exampleFr: "Je n'ai pas ses coordonnées, je n'ai aucun moyen de la contacter.",
  },
  {
    level: 'N2',
    pattern: '〜上で',
    fr: 'après avoir, en vue de (étape préalable)',
    example:
      '{内容|ないよう}をよく{確認|かくにん}した{上|うえ}で、サインしてください。',
    exampleFr: 'Signez après avoir bien vérifié le contenu.',
  },
  {
    level: 'N2',
    pattern: '〜末に',
    fr: 'au bout de (longue réflexion ou effort)',
    example:
      '{悩|なや}んだ{末|すえ}に、{仕事|しごと}を{変|か}えることにしました。',
    exampleFr: "Après avoir longuement hésité, j'ai décidé de changer de travail.",
  },
  {
    level: 'N2',
    pattern: '〜ものだ',
    fr: "(souvenir, vérité générale) on avait l'habitude de, c'est normal de",
    example:
      '{子|こ}どものころは、よく{川|かわ}で{遊|あそ}んだものです。',
    exampleFr: "Quand j'étais enfant, je jouais souvent à la rivière.",
  },
  {
    level: 'N2',
    pattern: '〜に関して',
    fr: 'au sujet de, à propos de',
    example:
      '{旅行|りょこう}に{関|かん}して、{質問|しつもん}があります。',
    exampleFr: "J'ai une question au sujet du voyage.",
  },
  {
    level: 'N2',
    pattern: '〜わけがない',
    fr: 'il est impossible que',
    example:
      '{彼|かれ}がそんなことを{言|い}うわけがありません。',
    exampleFr: "Il est impossible qu'il ait dit une chose pareille.",
  },
  {
    level: 'N2',
    pattern: '〜というより',
    fr: "plutôt que, ce n'est pas tant… que",
    example:
      'この{部屋|へや}は{広|ひろ}いというより、{何|なに}もないだけです。',
    exampleFr: "Cette pièce n'est pas tant grande que vide.",
  },
  {
    level: 'N2',
    pattern: '〜際に',
    fr: "lors de, à l'occasion de",
    example:
      '{旅行|りょこう}の{際|さい}に、パスポートを{忘|わす}れないでください。',
    exampleFr: "N'oubliez pas votre passeport lors du voyage.",
  },
  {
    level: 'N2',
    pattern: '〜だけあって',
    fr: 'à la hauteur de sa réputation, logiquement',
    example:
      '{有名|ゆうめい}な{店|みせ}だけあって、{料理|りょうり}がおいしかったです。',
    exampleFr: 'À la hauteur de sa réputation, la cuisine était délicieuse.',
  },
]

/** Liste complète : points de base + points supplémentaires (more.ts). */
export const GRAMMAR: GrammarPoint[] = [...BASE_GRAMMAR, ...MORE_GRAMMAR]

export const TOPICS: Topic[] = [
  // repas
  { theme: 'repas', ja: '{今日|きょう}{食|た}べたもの', fr: "Ce que tu as mangé aujourd'hui" },
  {
    theme: 'repas',
    ja: '{最近|さいきん}{行|い}ったレストランやカフェ',
    fr: 'Un restaurant ou un café où tu es allé(e) récemment',
  },
  {
    theme: 'repas',
    ja: '{作|つく}った{料理|りょうり}、{作|つく}ってみたい{料理|りょうり}',
    fr: 'Un plat que tu as cuisiné ou que tu voudrais essayer',
  },
  {
    theme: 'repas',
    ja: '{好|す}きな{食|た}べ{物|もの}と{苦手|にがて}な{食|た}べ{物|もの}',
    fr: 'Ce que tu aimes et ce que tu as du mal à manger',
  },
  { theme: 'repas', ja: '{朝|あさ}ごはんの{習慣|しゅうかん}', fr: 'Tes habitudes de petit-déjeuner' },
  // meteo
  { theme: 'meteo', ja: '{今日|きょう}の{天気|てんき}と{気分|きぶん}', fr: 'La météo du jour et ton humeur' },
  { theme: 'meteo', ja: '{好|す}きな{季節|きせつ}', fr: 'Ta saison préférée' },
  { theme: 'meteo', ja: '{季節|きせつ}の{行事|ぎょうじ}', fr: 'Une fête ou un événement de saison' },
  {
    theme: 'meteo',
    ja: '{最近|さいきん}の{天気|てんき}で{困|こま}ったこと',
    fr: 'Un souci causé par le temps récent',
  },
  // travail
  {
    theme: 'travail',
    ja: '{今日|きょう}の{仕事|しごと}（{勉強|べんきょう}）で{一番|いちばん}{大変|たいへん}だったこと',
    fr: 'Le plus difficile de ta journée de travail (ou d’études)',
  },
  {
    theme: 'travail',
    ja: '{同僚|どうりょう}や{先生|せんせい}との{会話|かいわ}',
    fr: 'Une conversation avec un(e) collègue ou un professeur',
  },
  {
    theme: 'travail',
    ja: '{仕事|しごと}が{終|お}わってからしたこと',
    fr: "Ce que tu as fait après le travail",
  },
  { theme: 'travail', ja: '{今週|こんしゅう}の{予定|よてい}', fr: 'Tes projets de la semaine' },
  {
    theme: 'travail',
    ja: '{最近|さいきん}{覚|おぼ}えた{新|あたら}しいこと',
    fr: 'Quelque chose de nouveau que tu as appris',
  },
  // amis
  { theme: 'amis', ja: '{友達|ともだち}と{会|あ}ったこと', fr: 'Une rencontre avec un(e) ami(e)' },
  { theme: 'amis', ja: '{家族|かぞく}のこと', fr: 'Ta famille' },
  {
    theme: 'amis',
    ja: '{最近|さいきん}{連絡|れんらく}した{人|ひと}',
    fr: 'Quelqu’un à qui tu as écrit ou parlé récemment',
  },
  { theme: 'amis', ja: 'ペットのこと', fr: 'Un animal de compagnie (le tien ou celui d’un proche)' },
  // sortie
  {
    theme: 'sortie',
    ja: '{今日|きょう}{行|い}った{場所|ばしょ}',
    fr: 'Un endroit où tu es allé(e) aujourd’hui',
  },
  { theme: 'sortie', ja: '{行|い}ってみたい{場所|ばしょ}', fr: 'Un endroit où tu aimerais aller' },
  {
    theme: 'sortie',
    ja: '{電車|でんしゃ}やバスでのできごと',
    fr: 'Quelque chose arrivé dans le train ou le bus',
  },
  { theme: 'sortie', ja: '{週末|しゅうまつ}の{散歩|さんぽ}', fr: 'Une balade de week-end' },
  { theme: 'sortie', ja: '{旅行|りょこう}の{思|おも}い{出|で}', fr: 'Un souvenir de voyage' },
  // sentiments
  {
    theme: 'sentiments',
    ja: '{今日|きょう}{一番|いちばん}うれしかったこと',
    fr: 'Ce qui t’a fait le plus plaisir aujourd’hui',
  },
  {
    theme: 'sentiments',
    ja: '{最近|さいきん}{心配|しんぱい}していること',
    fr: 'Ce qui te préoccupe en ce moment',
  },
  {
    theme: 'sentiments',
    ja: '{疲|つか}れた{日|ひ}の{過|す}ごし{方|かた}',
    fr: 'Comment tu passes une journée fatigante',
  },
  {
    theme: 'sentiments',
    ja: '{最近|さいきん}びっくりしたこと',
    fr: 'Quelque chose qui t’a surpris(e) récemment',
  },
  // maison
  {
    theme: 'maison',
    ja: '{家|いえ}でのんびり{過|す}ごした{時間|じかん}',
    fr: 'Un moment de détente à la maison',
  },
  {
    theme: 'maison',
    ja: '{部屋|へや}の{掃除|そうじ}・{片付|かたづ}け',
    fr: 'Ménage ou rangement',
  },
  {
    theme: 'maison',
    ja: '{買|か}ったもの、{買|か}いたいもの',
    fr: 'Ce que tu as acheté ou veux acheter',
  },
  {
    theme: 'maison',
    ja: '{一日|いちにち}のスケジュール',
    fr: 'Ton emploi du temps de la journée',
  },
  // loisirs
  {
    theme: 'loisirs',
    ja: '{最近|さいきん}{見|み}た{映画|えいが}やドラマ',
    fr: 'Un film ou une série vu(e) récemment',
  },
  { theme: 'loisirs', ja: '{読|よ}んだ{本|ほん}', fr: 'Un livre que tu as lu' },
  { theme: 'loisirs', ja: '{趣味|しゅみ}の{時間|じかん}', fr: 'Du temps consacré à un loisir' },
  {
    theme: 'loisirs',
    ja: '{日本語|にほんご}の{勉強|べんきょう}',
    fr: 'Ton étude du japonais',
  },
  { theme: 'loisirs', ja: '{聞|き}いた{音楽|おんがく}', fr: 'Une musique écoutée' },
]

export const VOCAB: Record<ThemeId, Word[]> = {
  repas: [
    { level: 'N3', ja: '材料', reading: 'ざいりょう', fr: 'ingrédient' },
    { level: 'N4', ja: '味', reading: 'あじ', fr: 'goût' },
    { level: 'N3', ja: '苦い', reading: 'にがい', fr: 'amer' },
    { level: 'N4', ja: '甘い', reading: 'あまい', fr: 'sucré' },
    { level: 'N4', ja: '辛い', reading: 'からい', fr: 'épicé, piquant' },
    { level: 'N4', ja: '焼く', reading: 'やく', fr: 'griller, cuire' },
    { level: 'N4', ja: '注文する', reading: 'ちゅうもんする', fr: 'commander' },
    { level: 'N3', ja: '冷める', reading: 'さめる', fr: 'refroidir' },
  ],
  meteo: [
    { level: 'N3', ja: '蒸し暑い', reading: 'むしあつい', fr: 'chaud et humide' },
    { level: 'N4', ja: '涼しい', reading: 'すずしい', fr: 'frais, agréable' },
    { level: 'N4', ja: '暖かい', reading: 'あたたかい', fr: 'doux, chaud' },
    { level: 'N3', ja: '台風', reading: 'たいふう', fr: 'typhon' },
    { level: 'N4', ja: '晴れる', reading: 'はれる', fr: 'se dégager (ciel)' },
    { level: 'N4', ja: '曇る', reading: 'くもる', fr: 'se couvrir' },
    { level: 'N3', ja: '気温', reading: 'きおん', fr: 'température' },
    { level: 'N4', ja: '傘', reading: 'かさ', fr: 'parapluie' },
  ],
  travail: [
    { level: 'N4', ja: '会議', reading: 'かいぎ', fr: 'réunion' },
    { level: 'N3', ja: '残業', reading: 'ざんぎょう', fr: 'heures supplémentaires' },
    { level: 'N4', ja: '相談する', reading: 'そうだんする', fr: 'demander conseil, discuter de' },
    { level: 'N4', ja: '準備', reading: 'じゅんび', fr: 'préparation' },
    { level: 'N3', ja: '資料', reading: 'しりょう', fr: 'documents, dossier' },
    { level: 'N3', ja: '課題', reading: 'かだい', fr: 'devoir, tâche à faire' },
    { level: 'N4', ja: '復習', reading: 'ふくしゅう', fr: 'révision' },
    { level: 'N4', ja: '遅れる', reading: 'おくれる', fr: 'être en retard' },
  ],
  amis: [
    { level: 'N4', ja: '約束', reading: 'やくそく', fr: 'promesse, rendez-vous' },
    { level: 'N3', ja: '招待する', reading: 'しょうたいする', fr: 'inviter' },
    { level: 'N4', ja: '久しぶり', reading: 'ひさしぶり', fr: 'depuis longtemps' },
    { level: 'N3', ja: '喧嘩', reading: 'けんか', fr: 'dispute' },
    { level: 'N3', ja: '親戚', reading: 'しんせき', fr: 'parents (famille élargie)' },
    { level: 'N4', ja: '連絡する', reading: 'れんらくする', fr: 'contacter' },
    { level: 'N3', ja: '相手', reading: 'あいて', fr: "l'autre personne, partenaire" },
    { level: 'N4', ja: '心配する', reading: 'しんぱいする', fr: "s'inquiéter" },
  ],
  sortie: [
    { level: 'N4', ja: '乗り換える', reading: 'のりかえる', fr: 'changer (de train, de ligne)' },
    { level: 'N4', ja: '混む', reading: 'こむ', fr: 'être bondé' },
    { level: 'N3', ja: '迷う', reading: 'まよう', fr: 'se perdre, hésiter' },
    { level: 'N3', ja: '景色', reading: 'けしき', fr: 'paysage' },
    { level: 'N3', ja: '到着する', reading: 'とうちゃくする', fr: 'arriver' },
    { level: 'N4', ja: '出発する', reading: 'しゅっぱつする', fr: 'partir' },
    { level: 'N4', ja: '予約する', reading: 'よやくする', fr: 'réserver' },
    { level: 'N3', ja: '渋滞', reading: 'じゅうたい', fr: 'embouteillage' },
  ],
  sentiments: [
    { level: 'N4', ja: '嬉しい', reading: 'うれしい', fr: 'heureux, content' },
    { level: 'N3', ja: '緊張する', reading: 'きんちょうする', fr: 'être stressé(e), tendu(e)' },
    { level: 'N4', ja: '安心する', reading: 'あんしんする', fr: 'être rassuré(e)' },
    { level: 'N3', ja: '不安', reading: 'ふあん', fr: 'inquiétude, anxiété' },
    { level: 'N3', ja: '驚く', reading: 'おどろく', fr: "être surpris(e)" },
    { level: 'N3', ja: '恥ずかしい', reading: 'はずかしい', fr: 'gêné(e), honteux' },
    { level: 'N4', ja: '楽しみ', reading: 'たのしみ', fr: "impatience (de quelque chose d'agréable)" },
    { level: 'N4', ja: '残念', reading: 'ざんねん', fr: 'dommage' },
  ],
  maison: [
    { level: 'N4', ja: '掃除', reading: 'そうじ', fr: 'ménage' },
    { level: 'N4', ja: '洗濯', reading: 'せんたく', fr: 'lessive' },
    { level: 'N3', ja: '片付ける', reading: 'かたづける', fr: 'ranger' },
    { level: 'N3', ja: '引っ越し', reading: 'ひっこし', fr: 'déménagement' },
    { level: 'N3', ja: '寝坊する', reading: 'ねぼうする', fr: 'se lever trop tard' },
    { level: 'N4', ja: '眠い', reading: 'ねむい', fr: 'avoir sommeil' },
    { level: 'N3', ja: '習慣', reading: 'しゅうかん', fr: 'habitude' },
    { level: 'N3', ja: '昼寝', reading: 'ひるね', fr: 'sieste' },
  ],
  loisirs: [
    { level: 'N4', ja: '趣味', reading: 'しゅみ', fr: 'passe-temps' },
    { level: 'N3', ja: '感動する', reading: 'かんどうする', fr: 'être ému(e)' },
    { level: 'N3', ja: '小説', reading: 'しょうせつ', fr: 'roman' },
    { level: 'N3', ja: '続き', reading: 'つづき', fr: 'suite' },
    { level: 'N3', ja: '経験', reading: 'けいけん', fr: 'expérience' },
    { level: 'N4', ja: '練習する', reading: 'れんしゅうする', fr: "s'entraîner" },
    { level: 'N4', ja: '覚える', reading: 'おぼえる', fr: 'retenir, mémoriser' },
    { level: 'N3', ja: '発音', reading: 'はつおん', fr: 'prononciation' },
  ],
}
