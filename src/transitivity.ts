import { conjugate, type Verb } from './conj/engine'
import { groupOf } from './conj/verbs'
import { plainText } from './furigana'
import type { QuizHistory, QuizQuestion } from './quiz'
import type { Entry } from './types'

const BLANK = '＿＿＿'
const DAY = 86_400_000

/** Une paire verbe intransitif (自動詞) ↔ verbe transitif (他動詞), avec une phrase pour chacun. */
export interface VerbPair {
  intr: string
  intrReading: string
  tr: string
  trReading: string
  /** Début de la phrase avec le verbe intransitif (sujet + particule). */
  intrFrame: string
  /** Début de la phrase avec le verbe transitif (complément + particule). */
  trFrame: string
  intrFr: string
  trFr: string
}

type Row = [string, string, string, string, string, string, string, string]

// intransitif, lecture, transitif, lecture, début de phrase (intr), début de phrase (tr), français (intr), français (tr)
const ROWS: Row[] = [
  ['開く', 'あく', '開ける', 'あける', 'ドアが', 'ドアを', "La porte s'ouvre.", "J'ouvre la porte."],
  ['閉まる', 'しまる', '閉める', 'しめる', 'ドアが', 'ドアを', 'La porte se ferme.', 'Je ferme la porte.'],
  ['つく', 'つく', 'つける', 'つける', '電気が', '電気を', "La lumière s'allume.", "J'allume la lumière."],
  ['消える', 'きえる', '消す', 'けす', '電気が', '電気を', "La lumière s'éteint.", "J'éteins la lumière."],
  ['始まる', 'はじまる', '始める', 'はじめる', '授業が', '授業を', 'Le cours commence.', 'Je commence le cours.'],
  ['終わる', 'おわる', '終える', 'おえる', '仕事が', '仕事を', 'Le travail se termine.', 'Je termine mon travail.'],
  ['止まる', 'とまる', '止める', 'とめる', '車が', '車を', "La voiture s'arrête.", "J'arrête la voiture."],
  ['動く', 'うごく', '動かす', 'うごかす', '機械が', '機械を', 'La machine bouge.', 'Je fais bouger la machine.'],
  ['落ちる', 'おちる', '落とす', 'おとす', '財布が', '財布を', 'Le portefeuille tombe.', 'Je fais tomber mon portefeuille.'],
  ['割れる', 'われる', '割る', 'わる', '皿が', '皿を', "L'assiette se brise.", "Je brise l'assiette."],
  ['壊れる', 'こわれる', '壊す', 'こわす', '時計が', '時計を', 'La montre est en panne.', 'Je casse la montre.'],
  ['切れる', 'きれる', '切る', 'きる', '糸が', '糸を', 'Le fil se coupe.', 'Je coupe le fil.'],
  ['折れる', 'おれる', '折る', 'おる', '枝が', '枝を', 'La branche casse.', 'Je casse la branche.'],
  ['破れる', 'やぶれる', '破る', 'やぶる', '紙が', '紙を', 'Le papier se déchire.', 'Je déchire le papier.'],
  ['汚れる', 'よごれる', '汚す', 'よごす', '服が', '服を', 'Le vêtement se salit.', 'Je salis le vêtement.'],
  ['直る', 'なおる', '直す', 'なおす', '機械が', '機械を', 'La machine est réparée.', 'Je répare la machine.'],
  ['治る', 'なおる', '治す', 'なおす', '風邪が', '風邪を', 'Le rhume guérit.', 'Je soigne mon rhume.'],
  ['変わる', 'かわる', '変える', 'かえる', '予定が', '予定を', 'Le programme change.', 'Je change le programme.'],
  ['決まる', 'きまる', '決める', 'きめる', '日程が', '日程を', 'La date est fixée.', 'Je fixe la date.'],
  ['集まる', 'あつまる', '集める', 'あつめる', '人が', '人を', 'Les gens se rassemblent.', 'Je rassemble des gens.'],
  ['見つかる', 'みつかる', '見つける', 'みつける', '鍵が', '鍵を', 'La clé est retrouvée.', 'Je trouve la clé.'],
  ['かかる', 'かかる', 'かける', 'かける', 'カーテンが', 'カーテンを', 'Le rideau est tendu.', "J'accroche le rideau."],
  ['入る', 'はいる', '入れる', 'いれる', 'お金が', 'お金を', "De l'argent rentre.", 'Je mets de l’argent.'],
  ['出る', 'でる', '出す', 'だす', '水が', '水を', "L'eau coule.", 'Je fais couler l’eau.'],
  ['乾く', 'かわく', '乾かす', 'かわかす', '洗濯物が', '洗濯物を', 'Le linge sèche.', 'Je fais sécher le linge.'],
  ['濡れる', 'ぬれる', '濡らす', 'ぬらす', 'タオルが', 'タオルを', 'La serviette est mouillée.', 'Je mouille la serviette.'],
  ['燃える', 'もえる', '燃やす', 'もやす', 'ゴミが', 'ゴミを', 'Les déchets brûlent.', 'Je brûle les déchets.'],
  ['沸く', 'わく', '沸かす', 'わかす', 'お湯が', 'お湯を', "L'eau bout.", "Je fais bouillir l'eau."],
  ['増える', 'ふえる', '増やす', 'ふやす', '体重が', '体重を', 'Mon poids augmente.', "J'augmente mon poids."],
  ['減る', 'へる', '減らす', 'へらす', 'ゴミが', 'ゴミを', 'Les déchets diminuent.', 'Je réduis les déchets.'],
  ['上がる', 'あがる', '上げる', 'あげる', '値段が', '値段を', 'Le prix monte.', 'Je monte le prix.'],
  ['下がる', 'さがる', '下げる', 'さげる', '温度が', '温度を', 'La température baisse.', 'Je baisse la température.'],
  ['起きる', 'おきる', '起こす', 'おこす', '子どもが', '子どもを', "L'enfant se réveille.", "Je réveille l'enfant."],
  ['建つ', 'たつ', '建てる', 'たてる', '家が', '家を', 'Une maison se construit.', 'Je fais construire une maison.'],
  ['並ぶ', 'ならぶ', '並べる', 'ならべる', '本が', '本を', 'Les livres sont alignés.', "J'aligne les livres."],
  ['乗る', 'のる', '乗せる', 'のせる', '子どもが車に', '子どもを車に', "L'enfant monte en voiture.", 'Je fais monter l’enfant en voiture.'],
  ['つながる', 'つながる', 'つなぐ', 'つなぐ', '電話が', '電話を', "L'appel passe.", 'Je passe l’appel.'],
  ['伝わる', 'つたわる', '伝える', 'つたえる', '気持ちが', '気持ちを', 'Le sentiment est compris.', 'Je transmets mon sentiment.'],
  ['進む', 'すすむ', '進める', 'すすめる', '計画が', '計画を', 'Le projet avance.', 'Je fais avancer le projet.'],
  ['揃う', 'そろう', '揃える', 'そろえる', '書類が', '書類を', 'Les documents sont réunis.', 'Je rassemble les documents.'],
  ['片付く', 'かたづく', '片付ける', 'かたづける', '部屋が', '部屋を', 'La pièce est rangée.', 'Je range la pièce.'],
  ['助かる', 'たすかる', '助ける', 'たすける', '人が', '人を', 'Une personne est sauvée.', 'Je sauve une personne.'],
  ['温まる', 'あたたまる', '温める', 'あたためる', '部屋が', 'スープを', 'La pièce se réchauffe.', 'Je réchauffe la soupe.'],
  ['冷える', 'ひえる', '冷やす', 'ひやす', 'ビールが', 'ビールを', 'La bière refroidit.', 'Je fais refroidir la bière.'],
  ['逃げる', 'にげる', '逃がす', 'にがす', '鳥が', '鳥を', "L'oiseau s'enfuit.", 'Je libère l’oiseau.'],
  ['隠れる', 'かくれる', '隠す', 'かくす', '子どもが', '財布を', "L'enfant se cache.", 'Je cache mon portefeuille.'],
  ['回る', 'まわる', '回す', 'まわす', '車輪が', '車輪を', 'La roue tourne.', 'Je fais tourner la roue.'],
  ['流れる', 'ながれる', '流す', 'ながす', '涙が', '涙を', 'Les larmes coulent.', 'Je verse des larmes.'],
  ['育つ', 'そだつ', '育てる', 'そだてる', '子どもが', '花を', "L'enfant grandit.", 'Je fais pousser des fleurs.'],
  ['生まれる', 'うまれる', '産む', 'うむ', '赤ちゃんが', 'ニワトリが卵を', 'Un bébé naît.', 'La poule pond un œuf.'],
  ['沈む', 'しずむ', '沈める', 'しずめる', '船が', '船を', 'Le bateau coule.', 'Je coule le bateau.'],
  ['冷める', 'さめる', '冷ます', 'さます', 'コーヒーが', 'コーヒーを', 'Le café refroidit.', 'Je laisse refroidir le café.'],
  ['外れる', 'はずれる', '外す', 'はずす', 'ボタンが', 'ボタンを', 'Le bouton se détache.', 'Je détache le bouton.'],
  ['付く', 'つく', '付ける', 'つける', '傷が', '傷を', 'Une rayure apparaît.', 'Je fais une rayure.'],
  ['戻る', 'もどる', '戻す', 'もどす', 'お金が', '本を', "L'argent revient.", 'Je remets le livre.'],
  ['残る', 'のこる', '残す', 'のこす', 'ご飯が', 'ご飯を', 'Il reste du riz.', 'Je laisse du riz.'],
  ['溶ける', 'とける', '溶かす', 'とかす', '氷が', '氷を', 'La glace fond.', 'Je fais fondre la glace.'],
  ['焼ける', 'やける', '焼く', 'やく', '魚が', '魚を', 'Le poisson cuit.', 'Je fais griller le poisson.'],
  ['煮える', 'にえる', '煮る', 'にる', '野菜が', '野菜を', 'Les légumes cuisent.', 'Je fais mijoter les légumes.'],
  ['揺れる', 'ゆれる', '揺らす', 'ゆらす', '木が', '木を', "L'arbre se balance.", 'Je secoue l’arbre.'],
  ['倒れる', 'たおれる', '倒す', 'たおす', '看板が', '看板を', 'Le panneau tombe.', 'Je renverse le panneau.'],
  ['潰れる', 'つぶれる', '潰す', 'つぶす', '箱が', '箱を', "La boîte s'écrase.", "J'écrase la boîte."],
  ['売れる', 'うれる', '売る', 'うる', '本が', '本を', 'Le livre se vend bien.', 'Je vends le livre.'],
  ['見える', 'みえる', '見る', 'みる', '山が', '山を', 'On voit la montagne.', 'Je regarde la montagne.'],
  ['聞こえる', 'きこえる', '聞く', 'きく', '音が', '音を', 'On entend un bruit.', "J'écoute un bruit."],
  ['ほどける', 'ほどける', 'ほどく', 'ほどく', '靴ひもが', '靴ひもを', 'Le lacet se défait.', 'Je défais le lacet.'],
  ['まとまる', 'まとまる', 'まとめる', 'まとめる', '話が', '荷物を', "L'accord se fait.", 'Je rassemble mes bagages.'],
  ['貯まる', 'たまる', '貯める', 'ためる', 'お金が', 'お金を', "L'argent s'accumule.", "J'économise de l'argent."],
  ['広がる', 'ひろがる', '広げる', 'ひろげる', '噂が', '地図を', 'La rumeur se répand.', 'Je déplie la carte.'],
  ['続く', 'つづく', '続ける', 'つづける', '雨が', '仕事を', 'La pluie continue.', 'Je continue mon travail.'],
  ['泊まる', 'とまる', '泊める', 'とめる', '友達が', '友達を', 'Mon ami dort chez moi.', "J'héberge mon ami."],
  ['抜ける', 'ぬける', '抜く', 'ぬく', '歯が', '歯を', 'Une dent tombe.', "J'arrache une dent."],
  ['こぼれる', 'こぼれる', 'こぼす', 'こぼす', '牛乳が', '牛乳を', 'Le lait se renverse.', 'Je renverse le lait.'],
  ['焦げる', 'こげる', '焦がす', 'こがす', 'パンが', 'パンを', 'Le pain brûle.', 'Je brûle le pain.'],
  ['乱れる', 'みだれる', '乱す', 'みだす', '列が', '列を', 'Les rangs se désorganisent.', 'Je désorganise les rangs.'],
  ['離れる', 'はなれる', '離す', 'はなす', '手が', '手を', 'Ma main se détache.', 'Je lâche la main.'],
  ['伸びる', 'のびる', '伸ばす', 'のばす', '髪が', '髪を', 'Mes cheveux poussent.', 'Je laisse pousser mes cheveux.'],
  ['受かる', 'うかる', '受ける', 'うける', '試験に', '試験を', "Je réussis l'examen.", "Je passe l'examen."],
]

export const PAIRS: VerbPair[] = ROWS.map(
  ([intr, intrReading, tr, trReading, intrFrame, trFrame, intrFr, trFr]) => ({
    intr,
    intrReading,
    tr,
    trReading,
    intrFrame,
    trFrame,
    intrFr,
    trFr,
  }),
)

const HAS_KANJI = /\p{Script=Han}/u

/** Le verbe avec sa lecture (si elle apporte quelque chose) : 開く（あく）. */
export function label(ja: string, reading: string): string {
  return HAS_KANJI.test(ja) ? `${ja}（${reading}）` : ja
}

/** Balisage furigana {漢字|かんじ}送り仮名 pour l'affichage de la bonne réponse. */
function ruby(ja: string, reading: string): string {
  const okuri = ja.match(/[぀-ゟ]+$/)?.[0] ?? ''
  const stem = ja.slice(0, ja.length - okuri.length)
  if (!stem || !HAS_KANJI.test(stem) || !reading.endsWith(okuri)) return ja
  return `{${stem}|${reading.slice(0, reading.length - okuri.length)}}${okuri}`
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function weightFrom(base: number, key: string, history: QuizHistory, now: number): number {
  const h = history[key]
  if (!h) return base * 2
  if (now - h.last < DAY * 0.8 && h.right >= h.wrong) return base * 0.05
  if (h.wrong > h.right) return base * 3
  return base / (1 + h.right)
}

const INTR = '自動詞（intransitif）'
const TR = '他動詞（transitif）'

function note(p: VerbPair): string {
  return (
    `${label(p.intr, p.intrReading)} = intransitif (自動詞) : ça se produit tout seul, avec が. ` +
    `${label(p.tr, p.trReading)} = transitif (他動詞) : quelqu'un agit, avec を.`
  )
}

/** Deux types de questions : choisir le verbe de la phrase, et dire si un verbe est transitif ou non. */
export function transitivityQuestions(
  history: QuizHistory,
  deck: Set<string>,
  links: TransitivityLink[],
  rand: () => number,
  now: number,
): { key: string; weight: number; question: QuizQuestion }[] {
  const out: { key: string; weight: number; question: QuizQuestion }[] = []
  for (const p of PAIRS) {
    const inDeck = (deck.has(p.intr) || deck.has(p.tr) ? 1.6 : 1) * linkFactor(links, p)
    const optI = label(p.intr, p.intrReading)
    const optT = label(p.tr, p.trReading)
    const sentences: [string, string, string, string, string][] = [
      [`t|${p.intr}|i`, p.intrFrame, p.intrFr, optI, p.intr + '|' + p.intrReading],
      [`t|${p.intr}|t`, p.trFrame, p.trFr, optT, p.tr + '|' + p.trReading],
    ]
    for (const [key, frame, fr, right, src] of sentences) {
      if (history[key]?.hidden) continue
      const [ja, reading] = src.split('|')
      const wrong = right === optI ? optT : optI
      out.push({
        key,
        weight: weightFrom(3 * inDeck, key, history, now),
        question: {
          item: {
            key,
            entryId: '',
            kind: 'vocabulaire',
            original: wrong,
            corrected: ruby(ja, reading),
            correctPlain: right,
            explanation: note(p),
            context: `${frame}${BLANK}。（${fr}）`,
          },
          options: shuffle([right, wrong], rand),
        },
      })
    }
    const kinds: [string, string, string, string][] = [
      [`t|${p.intr}|c`, p.intr, p.intrReading, INTR],
      [`t|${p.tr}|c`, p.tr, p.trReading, TR],
    ]
    for (const [key, ja, reading, right] of kinds) {
      if (history[key]?.hidden) continue
      out.push({
        key,
        weight: weightFrom(1.5 * inDeck, key, history, now),
        question: {
          item: {
            key,
            entryId: '',
            kind: 'vocabulaire',
            original: right === INTR ? TR : INTR,
            corrected: right,
            correctPlain: right,
            explanation: note(p),
            context: label(ja, reading),
          },
          options: shuffle([INTR, TR], rand),
        },
      })
    }
  }
  return out
}

/** Une série de questions, au hasard pondéré (ratés d'abord, verbes de ton deck un peu plus souvent). */
export function buildTransitivityDrill(
  history: QuizHistory,
  deck: Set<string>,
  links: TransitivityLink[],
  count = 10,
  rand: () => number = Math.random,
  now = Date.now(),
): QuizQuestion[] {
  const pool = transitivityQuestions(history, deck, links, rand, now)
  const chosen: QuizQuestion[] = []
  const pairsUsed = new Set<string>()
  while (chosen.length < count && pool.length > 0) {
    let roll = rand() * pool.reduce((a, c) => a + c.weight, 0)
    let index = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].weight
      if (roll < 0) {
        index = i
        break
      }
    }
    const [picked] = pool.splice(index, 1)
    // Pas deux questions sur la même paire dans une série : on mélange les verbes.
    const verb = picked.key.split('|')[1]
    const pair = PAIRS.find((p) => p.intr === verb || p.tr === verb)?.intr ?? verb
    if (pairsUsed.has(pair)) continue
    pairsUsed.add(pair)
    chosen.push(picked.question)
  }
  return chosen
}

// ------------------------------------------------------------------ liens avec tes fautes

/** Formes de surface d'un verbe (dictionnaire, ない, た, て, ば, ます…) pour le retrouver dans un texte. */
function surfaces(ja: string, reading: string): string[] {
  const v: Verb = { ja, reading, fr: '', group: groupOf(ja, reading) }
  const out = new Set<string>([ja])
  for (const f of ['nai', 'ta', 'te', 'ba', 'tai', 'volitional'] as const) {
    const c = conjugate(v, f)
    if (c) out.add(c.ja)
  }
  const tai = conjugate(v, 'tai')?.ja
  if (tai?.endsWith('たい')) {
    const stem = tai.slice(0, -2)
    for (const end of ['ます', 'ました', 'ません', 'ましょう']) out.add(stem + end)
  }
  // Les verbes écrits en kana seuls sont trop courts pour être repérés sans se tromper.
  return [...out].filter((s) => s.length >= 3 || HAS_KANJI.test(s))
}

const SURFACES: { pair: VerbPair; side: 'i' | 't'; forms: string[] }[] = PAIRS.flatMap((p) => [
  { pair: p, side: 'i' as const, forms: surfaces(p.intr, p.intrReading) },
  { pair: p, side: 't' as const, forms: surfaces(p.tr, p.trReading) },
])

/** Verbes de paires présents dans un texte : un par paire et par côté. */
function findVerbs(text: string): { pair: VerbPair; side: 'i' | 't' }[] {
  return SURFACES.filter((s) => s.forms.some((f) => text.includes(f))).map(({ pair, side }) => ({ pair, side }))
}

export interface TransitivityLink {
  pair: VerbPair
  /** swap : tu as employé l'autre verbe de la paire ; mention : un verbe de la paire dans une phrase corrigée. */
  kind: 'swap' | 'mention'
  original: string
  corrected: string
  /** Le passage corrigé, avec balisage de furigana. */
  markup: string
  explanation: string
  /** La phrase d'origine, ou le passage fautif à défaut. */
  sentence: string
}

/** Fautes corrigées qui touchent un verbe transitif / intransitif. */
export function transitivityLinks(entries: Entry[]): TransitivityLink[] {
  const out: TransitivityLink[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    const c = entry.correction
    if (!c) continue
    for (const e of c.errors) {
      const original = e.original.trim()
      const corrected = plainText(e.corrected).trim()
      if (!original || !corrected || original === corrected) continue
      const key = `${original}→${corrected}`
      if (seen.has(key)) continue
      const before = findVerbs(original)
      const after = findVerbs(corrected)
      let found: TransitivityLink['kind'] | null = null
      let pair: VerbPair | undefined
      for (const a of after) {
        if (before.some((b) => b.pair === a.pair && b.side !== a.side)) {
          found = 'swap'
          pair = a.pair
          break
        }
      }
      if (!found && (e.kind === 'particule' || e.kind === 'grammaire') && after.length > 0) {
        found = 'mention'
        pair = after[0].pair
      }
      if (!found || !pair) continue
      seen.add(key)
      const sentence =
        c.sourceText.split(/(?<=[。！？!?\n])/).find((s) => s.includes(original))?.trim() ?? original
      out.push({ pair, kind: found, original, corrected, markup: e.corrected, explanation: e.explanation, sentence })
    }
  }
  return out
}

/** Poids ×4 pour une paire confondue (swap), ×2 pour une paire qui a donné lieu à une correction (mention). */
export function linkFactor(links: TransitivityLink[], pair: VerbPair): number {
  const mine = links.filter((l) => l.pair === pair)
  if (mine.some((l) => l.kind === 'swap')) return 4
  return mine.length > 0 ? 2 : 1
}

// ------------------------------------------------------------------ réponse écrite

export interface WrittenQuestion {
  key: string
  /** Phrase avec le blanc. */
  frame: string
  /** Traduction française (absente pour une phrase tirée de tes textes). */
  fr?: string
  /** Réponses acceptées (kanji et kana). */
  answers: string[]
  /** Bonne réponse avec furigana, pour l'affichage. */
  display: string
  explanation: string
  pair: VerbPair
  /** Vient d'une de tes fautes. */
  own?: boolean
}

/** Retire le balisage de lecture : {開|あ}ける → あける. */
function readingText(markup: string): string {
  return markup.replace(/\{([^|{}]+)\|([^|{}]+)(?:\|[^{}]*)?\}/g, '$2')
}

function normalize(s: string): string {
  return s.normalize('NFKC').replace(/\s+/g, '').replace(/[。.]$/, '')
}

export function checkWritten(q: WrittenQuestion, typed: string): boolean {
  const clean = normalize(typed)
  return clean !== '' && q.answers.some((a) => normalize(a) === clean)
}

export function writtenQuestions(
  history: QuizHistory,
  deck: Set<string>,
  links: TransitivityLink[],
  entries: Entry[],
  now: number,
): { key: string; weight: number; pair: VerbPair; question: WrittenQuestion }[] {
  const out: { key: string; weight: number; pair: VerbPair; question: WrittenQuestion }[] = []
  void entries
  for (const p of PAIRS) {
    const factor = (deck.has(p.intr) || deck.has(p.tr) ? 1.6 : 1) * linkFactor(links, p)
    const sides: [string, string, string, string, string, string][] = [
      [`tw|${p.intr}|i`, p.intrFrame, p.intrFr, p.intr, p.intrReading, ''],
      [`tw|${p.intr}|t`, p.trFrame, p.trFr, p.tr, p.trReading, ''],
    ]
    for (const [key, frame, fr, ja, reading] of sides) {
      if (history[key]?.hidden) continue
      out.push({
        key,
        weight: weightFrom(3 * factor, key, history, now),
        pair: p,
        question: {
          key,
          frame: `${frame}${BLANK}。`,
          fr,
          answers: [ja, reading],
          display: ruby(ja, reading),
          explanation: note(p),
          pair: p,
        },
      })
    }
  }
  // Tes propres phrases : on te redemande le passage corrigé, écrit.
  for (const l of links) {
    if (l.corrected.length > 12 || !l.sentence.includes(l.original)) continue
    const key = `tw|own|${l.original}→${l.corrected}`
    if (history[key]?.hidden) continue
    const markup = l.markup
    out.push({
      key,
      weight: weightFrom(6, key, history, now),
      pair: l.pair,
      question: {
        key,
        frame: l.sentence.replace(l.original, BLANK),
        answers: [plainText(markup), readingText(markup)],
        display: markup,
        explanation: l.explanation ? `${l.explanation} — ${note(l.pair)}` : note(l.pair),
        pair: l.pair,
        own: true,
      },
    })
  }
  return out
}

export function buildWrittenDrill(
  history: QuizHistory,
  deck: Set<string>,
  links: TransitivityLink[],
  entries: Entry[],
  count = 10,
  rand: () => number = Math.random,
  now = Date.now(),
): WrittenQuestion[] {
  const all = writtenQuestions(history, deck, links, entries, now)
  const chosen: WrittenQuestion[] = []
  const used = new Set<string>()
  const draw = (pool: typeof all, limit: number, minWeight = 0) => {
    let taken = 0
    while (chosen.length < count && taken < limit && pool.length > 0) {
      let roll = rand() * pool.reduce((a, c) => a + c.weight, 0)
      let index = pool.length - 1
      for (let i = 0; i < pool.length; i++) {
        roll -= pool[i].weight
        if (roll < 0) {
          index = i
          break
        }
      }
      const [picked] = pool.splice(index, 1)
      if (picked.weight < minWeight) continue
      const slot = picked.pair.intr + (picked.question.own ? '|own' : '')
      if (used.has(slot)) continue
      used.add(slot)
      chosen.push(picked.question)
      taken++
    }
  }
  // Tes propres fautes d'abord (jusqu'à 3, sauf celles réussies hier ou aujourd'hui), puis les paires.
  draw(all.filter((x) => x.question.own), 3, 2)
  draw(all.filter((x) => !x.question.own), count)
  // Mélange : les phrases tirées de tes fautes ne sont pas toutes au début.
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[chosen[i], chosen[j]] = [chosen[j], chosen[i]]
  }
  return chosen
}
