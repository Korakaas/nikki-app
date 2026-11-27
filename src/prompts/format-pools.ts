/*
  Grammaire et mots logiques selon le format du jour (S5.6b).
  Chaque format a sa liste de points de grammaire (écrits comme dans data.ts / more.ts) et les thèmes
  de vocabulaire dans lesquels on pioche quand le texte du jour ne donne pas assez de mots.
  Le journal libre n'a pas de liste : il garde le tirage d'après le sujet du jour.
  Rien n'est envoyé à l'API.
*/

import type { FormatId } from '../formats'
import type { ThemeId } from './data'

export const FORMAT_GRAMMAR: Record<FormatId, string[]> = {
  journal: [],
  // Lettre : formules polies, demandes, projets, remerciements, conseils.
  lettre: [
    '〜ていただけませんか', '〜てくださる', '〜てほしい', '〜てくれる／〜てあげる／〜てもらう', '〜(さ)せてもらう',
    '〜ことにする', '〜ことになる', '〜つもりだ', '〜(よ)うと思う', '〜たら', '〜ば', '〜ので', '〜ように（目的）',
    '〜について', '〜ところだ', '〜ようになる', '〜てよかった', '〜かもしれない', '〜たほうがいい',
    '〜ないでください', '〜てから', '〜ながら', '〜に対して', '〜際に', '〜次第', '〜をきっかけに',
    '〜てくる／〜ていく（変化）', '〜ことがある', '〜たばかりだ', '〜上で', '〜ずに',
  ],
  // Avis : dire ce qu'on pense, comparer, recommander.
  avis: [
    '〜と思う', '〜らしい', '〜によると', '〜ほど', '〜くらい／ぐらい', '〜より〜のほうが', '〜のが好き／上手',
    '〜やすい／〜にくい', '〜すぎる', '〜わりに', '〜に比べて', '〜にしては', '〜だけでなく', '〜のみならず',
    '〜はもちろん', '〜ものがある', '〜に限る', '〜というより', '〜みたいだ', '〜っぽい', '〜そうだ（様子）',
    '〜ばかりか', '〜に関して', '〜ても', '〜てよかった', '〜たことがある', '〜づらい', '〜がち',
    '〜てしかたがない／〜てたまらない', '〜だけあって', '〜として', '〜上に',
  ],
  // Dialogue : langue parlée, propositions, réactions, refus polis.
  dialogue: [
    '〜てもいい', '〜てはいけない', '〜なくてもいい', '〜てみる', '〜ておく', '〜ことができる', '可能形 〜(ら)れる／〜える',
    '〜でしょう／〜だろう', '〜かもしれない', '〜たほうがいい', '〜たら', '〜なら', '〜と（条件）', '〜つもりだ',
    '〜てしまう', '〜し〜し', '〜でも（例示）', '〜か（間接疑問）', '〜かどうか', '〜たがる', '〜てほしい', '〜ないで',
    '〜はずだ', '〜みたいだ', '〜っぽい', '〜らしい', '〜そうだ（伝聞）', '〜わけにはいかない', '〜ようにする',
    '〜てくれる／〜てあげる／〜てもらう', '〜ていただけませんか', '〜ことはない', '〜ところだ',
  ],
  // Description : ce qu'on voit, entend, ressent ; états et ressemblances.
  description: [
    '〜ている（進行）', '〜てある', '〜ように（比喩）', '〜みたいだ', '〜そうだ（様子）', '〜っぽい', '〜げ', '〜だらけ',
    '〜まま', '〜っぱなし', '〜かのようだ', '〜がち', '〜ほど', '〜くらい／ぐらい', '〜とき', '〜ながら', '〜間に',
    '〜うちに', '〜から〜にかけて', '〜に沿って', '〜に応じて', '〜くなる／〜になる', '〜くする／〜にする',
    '〜てくる／〜ていく（変化）', '〜つつある', '〜気味', '〜ものがある', '〜たところ',
  ],
  // Opinion : accord, désaccord, raisons, nuances.
  opinion: [
    '〜と思う', '〜べきだ', '〜からこそ', '〜わけではない', '〜とは限らない', '〜にとって', '〜によって', '〜に対して',
    '〜というものではない', '〜ことだ（助言）', '〜はずがない', '〜わけがない', '〜に違いない', '〜ざるを得ない',
    '〜ほかない', '〜ものだ', '〜にすぎない', '〜にほかならない', '〜どころか', '〜ばかりか', '〜だけでなく',
    '〜のみならず', '〜上で', '〜ため（に）（原因）', '〜せいで', '〜おかげで', '〜ば〜ほど', '〜さえ〜ば', '〜場合は',
    '〜としても', '〜にしても', '〜からといって', '〜ことなく', '〜に比べて', '〜より〜のほうが', '〜というより',
    '〜わりに', '〜ものの', '〜からには', '〜に関して', '〜をめぐって', '〜に基づいて', '〜として', '〜かねない',
    '〜おそれがある', '〜に限る',
  ],
}

/** Thèmes de vocabulaire où piocher les mots d'un format (après les mots du texte du jour). */
export const FORMAT_THEMES: Record<FormatId, ThemeId[]> = {
  journal: [],
  lettre: ['amis', 'sentiments', 'sortie', 'travail'],
  avis: ['loisirs', 'sortie', 'repas', 'sentiments'],
  dialogue: ['amis', 'sortie', 'repas', 'travail'],
  description: ['maison', 'meteo', 'sortie', 'repas'],
  opinion: ['travail', 'sentiments', 'loisirs', 'maison'],
}
