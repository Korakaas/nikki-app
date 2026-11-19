/*
  Amorces de phrase : un début de phrase à toucher pour ne pas fixer une page vide.
  Rien n'est envoyé à l'API : tout est écrit ici, classé par thème, avec le balisage de
  furigana {漢字|かんじ} (voir furigana.tsx).
*/

import { TOPICS, type ThemeId } from './data'

export interface Starter {
  ja: string
  fr: string
}

const s = (ja: string, fr: string): Starter => ({ ja, fr })

export const STARTERS: Record<ThemeId, Starter[]> = {
  repas: [
    s('{今日|きょう}は{朝|あさ}ごはんに、', "Aujourd'hui au petit-déjeuner, …"),
    s('{昼|ひる}ごはんは、', 'Pour le déjeuner, …'),
    s('{夕|ゆう}ごはんは{自分|じぶん}で{作|つく}って、', "Pour le dîner, j'ai cuisiné moi-même, et …"),
    s('{最近|さいきん}、よく{食|た}べているのは、', 'Ces temps-ci, ce que je mange souvent, c\'est …'),
    s('{食|た}べたあとで、', 'Après avoir mangé, …'),
    s('{友達|ともだち}と{食事|しょくじ}をして、', "J'ai mangé avec un(e) ami(e), et …"),
  ],
  meteo: [
    s('{今日|きょう}は{雨|あめ}が{降|ふ}っていて、', "Aujourd'hui il pleuvait, et …"),
    s('{朝|あさ}から{空|そら}が{暗|くら}くて、', 'Dès le matin le ciel était sombre, et …'),
    s('{雨|あめ}の{日|ひ}は、いつも', "Les jours de pluie, d'habitude …"),
    s('{今日|きょう}は{天気|てんき}がよかったので、', "Comme il faisait beau aujourd'hui, …"),
    s('{最近|さいきん}、だんだん{寒|さむ}くなってきて、', 'Ces temps-ci il fait de plus en plus froid, et …'),
    s('{外|そと}に{出|で}ると、', 'Quand je suis sortie, …'),
  ],
  travail: [
    s('{今日|きょう}の{仕事|しごと}は、', "Le travail d'aujourd'hui, …"),
    s('{朝|あさ}から{会議|かいぎ}があって、', "Dès le matin il y avait une réunion, et …"),
    s('{同僚|どうりょう}に{頼|たの}まれて、', "Un(e) collègue m'a demandé, et …"),
    s('{忙|いそが}しかったけれど、', "J'étais occupée, mais …"),
    s('{仕事|しごと}が{終|お}わってから、', 'Après le travail, …'),
    s('{最近|さいきん}、{仕事|しごと}で{気|き}づいたのは、', 'Ce que j\'ai remarqué au travail ces temps-ci, c\'est …'),
  ],
  amis: [
    s('{今日|きょう}は{友達|ともだち}に{会|あ}って、', "Aujourd'hui j'ai vu un(e) ami(e), et …"),
    s('{久|ひさ}しぶりに{連絡|れんらく}をとって、', "J'ai repris contact pour la première fois depuis longtemps, et …"),
    s('{家族|かぞく}と{話|はな}していたら、', "En parlant avec ma famille, …"),
    s('{友達|ともだち}が{教|おし}えてくれたのは、', 'Ce que mon ami(e) m\'a appris, c\'est …'),
    s('{一緒|いっしょ}に{出|で}かけたとき、', 'Quand nous sommes sortis ensemble, …'),
    s('{会|あ}えなかったけれど、', "Je n'ai pas pu le/la voir, mais …"),
  ],
  sortie: [
    s('{今日|きょう}は{初|はじ}めて{行|い}った{場所|ばしょ}で、', "Aujourd'hui, dans un endroit où j'allais pour la première fois, …"),
    s('{電車|でんしゃ}に{乗|の}っているとき、', 'Dans le train, …'),
    s('{帰|かえ}り{道|みち}に、', 'Sur le chemin du retour, …'),
    s('{散歩|さんぽ}をしていたら、', "Pendant que je me promenais, …"),
    s('{町|まち}で{見|み}かけたのは、', 'Ce que j\'ai aperçu en ville, c\'est …'),
    s('{出|で}かける{前|まえ}に、', 'Avant de sortir, …'),
  ],
  sentiments: [
    s('{今日|きょう}はなんだか{嬉|うれ}しくて、', "Aujourd'hui j'étais contente, sans trop savoir pourquoi, et …"),
    s('{少|すこ}し{不安|ふあん}だったけれど、', "J'étais un peu inquiète, mais …"),
    s('{気持|きも}ちが{落|お}ち{着|つ}いてきて、', 'Je me suis calmée peu à peu, et …'),
    s('{思|おも}わず{笑|わら}ってしまったのは、', "Ce qui m'a fait rire malgré moi, c'est …"),
    s('{最近|さいきん}、よく{考|かんが}えるのは、', 'Ce à quoi je pense souvent ces temps-ci, c\'est …'),
    s('{今|いま}の{気分|きぶん}は、', 'Mon humeur du moment, c\'est …'),
  ],
  maison: [
    s('{今日|きょう}は{一日|いちにち}{家|いえ}にいて、', "Aujourd'hui je suis restée à la maison toute la journée, et …"),
    s('{部屋|へや}を{片付|かたづ}けていたら、', "En rangeant ma chambre, …"),
    s('{掃除|そうじ}が{終|お}わったあとで、', 'Après avoir fini le ménage, …'),
    s('{夜|よる}、{寝|ね}る{前|まえ}に、', 'Le soir, avant de dormir, …'),
    s('{洗濯|せんたく}をしながら、', 'Tout en faisant la lessive, …'),
    s('{家|いえ}の{中|なか}で{見|み}つけたのは、', 'Ce que j\'ai trouvé dans la maison, c\'est …'),
  ],
  loisirs: [
    s('{今日|きょう}は{映画|えいが}を{見|み}て、', "Aujourd'hui j'ai regardé un film, et …"),
    s('{最近|さいきん}{読|よ}んでいる{本|ほん}は、', 'Le livre que je lis en ce moment, …'),
    s('{休|やす}みの{日|ひ}は、いつも', "Les jours de congé, d'habitude …"),
    s('{時間|じかん}があったので、', "Comme j'avais du temps, …"),
    s('{好|す}きな{音楽|おんがく}を{聞|き}きながら、', 'En écoutant ma musique préférée, …'),
    s('{手|て}で{何|なに}かを{作|つく}っていて、', "J'étais en train de fabriquer quelque chose à la main, et …"),
  ],
}

/** Quand il n'y a pas de sujet du jour (sujet retiré). */
export const GENERIC_STARTERS: Starter[] = [
  s('{今日|きょう}は、', "Aujourd'hui, …"),
  s('{朝|あさ}、{起|お}きてから、', 'Le matin, après le réveil, …'),
  s('{今日|きょう}いちばん{印象|いんしょう}に{残|のこ}ったのは、', "Ce qui m'a le plus marquée aujourd'hui, c'est …"),
  s('{昨日|きのう}と{違|ちが}って、', "Contrairement à hier, …"),
  s('{夜|よる}になって、', 'Le soir venu, …'),
  s('{特|とく}に{何|なに}もなかったけれど、', "Il ne s'est rien passé de spécial, mais …"),
]

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Trois amorces différentes, adaptées au sujet du jour (son thème).
 * Même jour + même sujet = mêmes amorces : elles ne bougent pas quand on rouvre la page.
 */
export function pickStarters(topicJa: string | null | undefined, dateId: string, count = 3): Starter[] {
  const theme = topicJa ? TOPICS.find((t) => t.ja === topicJa)?.theme : undefined
  const pool = theme ? STARTERS[theme] : GENERIC_STARTERS
  const order = pool.map((starter, i) => ({ starter, key: hash(`${dateId}#${topicJa ?? ''}#${i}`) }))
  order.sort((a, b) => a.key - b.key)
  return order.slice(0, Math.min(count, pool.length)).map((o) => o.starter)
}
