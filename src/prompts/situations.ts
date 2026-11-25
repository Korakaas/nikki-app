/*
  Banque de mises en situation du format du jour (S5.4a) : tout est écrit ici, rien n'est envoyé à l'API.
  Une nouvelle banque est ajoutée chaque mois (voir README, « Banque de textes »). Les textes de chaque
  format se suivent dans l'ordre ; quand ils sont tous passés, on recommence au premier : rien ne bloque.

  Le journal libre n'a pas de texte : le thème du jour suffit.
  Les textes ont le balisage de furigana {漢字|かんじ} (voir furigana.tsx) ; « \n » = retour à la ligne.
*/

import { FORMAT_IDS, dayNumber, formatOfDay, type FormatId } from '../formats'

export interface Situation {
  /** Identifiant stable, ex. « L1 ». */
  id: string
  /** Le texte japonais balisé (une lettre, une scène, une question). */
  ja: string
  /** Aide en français (cachée derrière un appui). */
  aide: string
  /** Consigne propre à ce texte, en plus de celle du format. */
  todo?: string
  /** Mots utiles facultatifs (descriptions). */
  words?: { ja: string; fr: string }[]
}

const w = (ja: string, fr: string) => ({ ja, fr })

/** Banque de décembre 2026. */
const BANK_2026_12: Partial<Record<FormatId, Situation[]>> = {
  lettre: [
    {
      id: 'L1',
      ja: '〇〇さんへ\nお{元気|げんき}ですか。{先週|せんしゅう}から{新|あたら}しい{仕事|しごと}を{始|はじ}めました。まだ{慣|な}れなくて、{毎日|まいにち}とても{疲|つか}れています。〇〇さんは{最近|さいきん}どうですか。{今度|こんど}、{一緒|いっしょ}に{晩|ばん}ご{飯|はん}を{食|た}べませんか。\n{山本|やまもと}より',
      aide: 'Une amie a commencé un nouveau travail et elle est fatiguée. Elle propose un dîner.',
      todo: 'Prends de ses nouvelles, raconte ta semaine, propose un jour pour le dîner.',
    },
    {
      id: 'L2',
      ja: '〇〇さんへ\nこんにちは。{来月|らいげつ}、{京都|きょうと}に{旅行|りょこう}に{行|い}くことにしました。{二日間|ふつかかん}しかないので、どこに{行|い}くか{迷|まよ}っています。おすすめの{場所|ばしょ}やお{店|みせ}があったら、{教|おし}えてください。\n{鈴木|すずき}より',
      aide: 'Un ami part deux jours à Kyoto et demande des conseils.',
      todo: 'Donne deux ou trois idées de lieux ou de plats, et dis pourquoi.',
    },
    {
      id: 'L3',
      ja: '〇〇さんへ\nお{久|ひさ}しぶりです。{先月|せんげつ}、{引|ひ}っ{越|こ}しをしました。{駅|えき}から{近|ちか}くて{便利|べんり}ですが、{部屋|へや}が{少|すこ}し{狭|せま}いです。{落|お}ち{着|つ}いたら、{遊|あそ}びに{来|き}てください。\n{佐藤|さとう}より',
      aide: "Une amie a déménagé (près de la gare, mais petit) et t'invite chez elle.",
      todo: 'Félicite-la, pose-lui une question sur son nouveau quartier, dis quand tu pourrais venir.',
    },
    {
      id: 'L4',
      ja: '〇〇さんへ\n{先週|せんしゅう}は、{誕生日|たんじょうび}のプレゼントをありがとうございました。さっそく{使|つか}っています。お{礼|れい}に、{今度|こんど}ランチをごちそうさせてください。{来週|らいしゅう}のどこかで、{時間|じかん}はありますか。\n{高橋|たかはし}より',
      aide: "Un ami te remercie pour un cadeau d'anniversaire et propose un déjeuner.",
      todo: 'Dis que tu es contente et réponds à sa question sur tes disponibilités.',
    },
    {
      id: 'L5',
      ja: '〇〇さんへ\n{日本語|にほんご}の{勉強|べんきょう}はどうですか。{私|わたし}は{英語|えいご}を{勉強|べんきょう}していますが、なかなか{上手|じょうず}になりません。{何|なに}かいい{勉強|べんきょう}の{方法|ほうほう}があれば、{教|おし}えてください。\n{伊藤|いとう}より',
      aide: 'Un ami japonais apprend l\'anglais et te demande comment tu étudies.',
      todo: 'Explique comment tu étudies le japonais et donne-lui un conseil.',
    },
    {
      id: 'L6',
      ja: '〇〇さんへ\nこんにちは。{先週|せんしゅう}から{風邪|かぜ}をひいて、{会社|かいしゃ}を{休|やす}んでいます。{熱|ねつ}は{下|さ}がりましたが、まだ{咳|せき}が{出|で}ます。{早|はや}く{元気|げんき}になって、また{一緒|いっしょ}に{遊|あそ}びたいです。{最近|さいきん}、{何|なに}か{変|か}わったことはありましたか。\n{中村|なかむら}より',
      aide: 'Une amie est enrhumée et se repose chez elle. Elle demande de tes nouvelles.',
      todo: 'Souhaite-lui un bon rétablissement et raconte une nouveauté de ta semaine.',
    },
  ],
  avis: [
    {
      id: 'A1',
      ja: '{最近|さいきん}{見|み}た{映画|えいが}やドラマの{中|なか}で、{一番|いちばん}{心|こころ}に{残|のこ}った{作品|さくひん}は{何|なん}ですか。',
      aide: "Parmi les films ou séries vus récemment, lequel t'a le plus marquée ?",
    },
    {
      id: 'A2',
      ja: '{最近|さいきん}{行|い}ったレストランやカフェについて、{教|おし}えてください。おすすめですか。',
      aide: "Parle d'un restaurant ou d'un café où tu es allée récemment. Tu le recommandes ?",
    },
    {
      id: 'A3',
      ja: '{今|いま}までに{読|よ}んだ{本|ほん}の{中|なか}で、{人|ひと}に{勧|すす}めたい{本|ほん}はありますか。',
      aide: 'Parmi les livres que tu as lus, y en a-t-il un que tu voudrais conseiller ?',
    },
    {
      id: 'A4',
      ja: '{今|いま}までに{旅行|りょこう}した{町|まち}の{中|なか}で、{一番|いちばん}{好|す}きだった{町|まち}はどこですか。',
      aide: 'Parmi les villes que tu as visitées, laquelle as-tu préférée ?',
    },
    {
      id: 'A5',
      ja: '{子|こ}どもにおすすめの{本|ほん}や{映画|えいが}、{遊|あそ}びを{一|ひと}つ{教|おし}えてください。',
      aide: 'Conseille à un enfant un livre, un film ou un jeu.',
    },
    {
      id: 'A6',
      ja: '{最近|さいきん}{使|つか}ってよかったもの（アプリ、{道具|どうぐ}、{食|た}べ{物|もの}など）は{何|なん}ですか。',
      aide: "Qu'est-ce que tu as utilisé ou goûté récemment et apprécié (appli, objet, nourriture…) ?",
    },
  ],
  dialogue: [
    {
      id: 'D1',
      ja: '{場面|ばめん}：カフェ。{久|ひさ}しぶりに{会|あ}った{友達|ともだち}{同士|どうし}です。\nA「{久|ひさ}しぶり！{最近|さいきん}、{何|なに}か{新|あたら}しいことを{始|はじ}めた？」\nB「…」',
      aide: 'Deux amis se retrouvent au café. A demande si B a commencé quelque chose de nouveau.',
    },
    {
      id: 'D2',
      ja: '{場面|ばめん}：{駅|えき}。{旅行者|りょこうしゃ}が{駅員|えきいん}に{道|みち}を{聞|き}いています。\n{旅行者|りょこうしゃ}「すみません、{博物館|はくぶつかん}はどこですか。」\n{駅員|えきいん}「…」',
      aide: "Un touriste demande à un employé de gare où est le musée.",
    },
    {
      id: 'D3',
      ja: '{場面|ばめん}：レストラン。\n{店員|てんいん}「いらっしゃいませ。ご{注文|ちゅうもん}はお{決|き}まりですか。」\n{客|きゃく}「…」',
      aide: 'Le serveur demande si le client a choisi. Tu es le client.',
    },
    {
      id: 'D4',
      ja: '{場面|ばめん}：{電話|でんわ}。{友達|ともだち}が{約束|やくそく}を{変|か}えたがっています。\nA「ごめん、{明日|あした}の{約束|やくそく}なんだけど、{行|い}けなくなっちゃった。」\nB「…」',
      aide: "Un ami annule le rendez-vous de demain. Tu es B (ton décontracté entre amis).",
    },
    {
      id: 'D5',
      ja: '{場面|ばめん}：{会社|かいしゃ}。{同僚|どうりょう}が{頼|たの}みごとをしています。\n{同僚|どうりょう}「すみません、{今日|きょう}、{少|すこ}し{残業|ざんぎょう}できますか。」\nあなた「…」',
      aide: "Un collègue demande si tu peux faire des heures en plus aujourd'hui. Tu peux accepter, refuser ou proposer autre chose.",
    },
    {
      id: 'D6',
      ja: '{場面|ばめん}：{道|みち}。{誰|だれ}かが{落|お}とし{物|もの}をしました。\nあなた「あの、これ、{落|お}としましたよ。」\n{男|おとこ}の{人|ひと}「…」',
      aide: 'Tu rends un objet tombé à un inconnu.',
    },
  ],
  description: [
    {
      id: 'E1',
      ja: '{最近|さいきん}{見|み}た{映画|えいが}、ドラマ、または{読|よ}んだ{本|ほん}の{好|す}きな{場面|ばめん}を{説明|せつめい}してください。',
      aide: 'Décris une scène que tu as aimée dans un film, une série ou un livre récent.',
      words: [w('{場面|ばめん}', 'scène'), w('{登場人物|とうじょうじんぶつ}', 'personnage'), w('{主人公|しゅじんこう}', 'héros'), w('{雰囲気|ふんいき}', 'ambiance')],
    },
    {
      id: 'E2',
      ja: 'スマホのギャラリーにある、{一番|いちばん}{新|あたら}しい{写真|しゃしん}を{説明|せつめい}してください。',
      aide: 'Décris la photo la plus récente de ta galerie.',
      words: [w('{写|うつ}っている', 'apparaître sur la photo'), w('{背景|はいけい}', 'arrière-plan'), w('{真|ま}ん{中|なか}', 'milieu'), w('{色|いろ}', 'couleur')],
    },
    {
      id: 'E3',
      ja: '{今|いま}、{窓|まど}から{何|なに}が{見|み}えますか。',
      aide: 'Décris ce que tu vois par ta fenêtre en ce moment.',
      words: [w('{景色|けしき}', 'paysage'), w('{空|そら}', 'ciel'), w('{建物|たてもの}', 'bâtiment'), w('{天気|てんき}', 'météo')],
    },
    {
      id: 'E4',
      ja: 'あなたの{机|つくえ}（または、いつも{作業|さぎょう}する{場所|ばしょ}）の{様子|ようす}を{説明|せつめい}してください。',
      aide: "Décris ton bureau ou l'endroit où tu travailles d'habitude.",
      words: [w('{置|お}いてある', 'être posé'), w('{散|ち}らかっている', 'en désordre'), w('パソコン', 'ordinateur'), w('{隣|となり}', 'à côté')],
    },
    {
      id: 'E5',
      ja: '{今日|きょう}、{歩|ある}いた{道|みち}や{行|い}った{場所|ばしょ}の{様子|ようす}を{説明|せつめい}してください。',
      aide: "Décris un endroit où tu es passée aujourd'hui (rue, magasin, trajet).",
      words: [w('{通|とお}る', 'passer par'), w('{人通|ひとどお}り', 'passage'), w('{匂|にお}い', 'odeur'), w('{音|おと}', 'bruit')],
    },
    {
      id: 'E6',
      ja: '{好|す}きな{人|ひと}や{動物|どうぶつ}（{家族|かぞく}、{友達|ともだち}、ペットなど）について、{見|み}た{目|め}や{様子|ようす}を{説明|せつめい}してください。',
      aide: "Décris une personne ou un animal que tu aimes : son apparence, ses habitudes.",
      words: [w('{髪|かみ}', 'cheveux'), w('{性格|せいかく}', 'caractère'), w('よく〜する', 'faire souvent'), w('{似|に}ている', 'ressembler')],
    },
  ],
  opinion: [
    {
      id: 'O1',
      ja: '「{毎日|まいにち}、{日記|にっき}を{書|か}くのは{大切|たいせつ}だ。」',
      aide: 'Écrire un journal chaque jour est important.',
    },
    {
      id: 'O2',
      ja: '「{電車|でんしゃ}の{中|なか}でスマホを{使|つか}うのは、あまりよくない。」',
      aide: "Utiliser son téléphone dans le train n'est pas très bien.",
    },
    {
      id: 'O3',
      ja: '「{旅行|りょこう}は、{一人|ひとり}で{行|い}くほうが{楽|たの}しい。」',
      aide: 'Voyager seul est plus agréable.',
    },
    {
      id: 'O4',
      ja: '「{大人|おとな}になっても、{勉強|べんきょう}を{続|つづ}けるべきだ。」',
      aide: 'Même adulte, il faut continuer à étudier.',
    },
    {
      id: 'O5',
      ja: '「{家|いえ}で{働|はたら}くほうが、{会社|かいしゃ}で{働|はたら}くより{効率|こうりつ}がいい。」',
      aide: "Travailler chez soi est plus efficace qu'au bureau.",
    },
    {
      id: 'O6',
      ja: '「ペットを{飼|か}うことは、いい{経験|けいけん}になる。」',
      aide: 'Avoir un animal de compagnie est une bonne expérience.',
    },
  ],
}

/** Les banques, dans l'ordre : chaque mois, une nouvelle est ajoutée à la suite (les textes ne bougent jamais de place). */
const BANKS = [BANK_2026_12]

/** Tous les textes d'un format, toutes banques réunies. */
export function situationsOf(format: FormatId): Situation[] {
  return BANKS.flatMap((bank) => bank[format] ?? [])
}

/** Premier jour de la première banque : le nombre de fois où un format est déjà passé depuis ce jour fixe le texte du jour. */
const REF_DAY = dayNumber('2026-12-01')

function dayId(n: number): string {
  return new Date(n * 86400000).toISOString().slice(0, 10)
}

/** La mise en situation du jour pour un jour donné (null pour le journal libre). */
export function situationOfDay(id: string): Situation | null {
  const format = formatOfDay(id)
  const list = situationsOf(format)
  if (list.length === 0) return null
  const n = dayNumber(id)
  let count = 0
  if (n >= REF_DAY) {
    for (let d = REF_DAY; d < n; d++) if (formatOfDay(dayId(d)) === format) count++
  } else {
    // Avant le premier jour de la banque : on remonte à reculons depuis ses derniers textes.
    for (let d = n; d < REF_DAY; d++) if (formatOfDay(dayId(d)) === format) count--
  }
  return list[((count % list.length) + list.length) % list.length]
}

/** Pour les tests : le nombre de textes par format. */
export function bankSizes(): Record<FormatId, number> {
  return Object.fromEntries(FORMAT_IDS.map((f) => [f, situationsOf(f).length])) as Record<FormatId, number>
}
