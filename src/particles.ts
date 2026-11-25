import { plainText } from './furigana'
import type { QuizHistory, QuizQuestion } from './quiz'
import type { CorrectionItem, Entry } from './types'

const BLANK = '＿＿＿'
const DAY = 86_400_000

/** Particules qu'on sait reconnaître dans une correction. */
const KNOWN = new Set(['は', 'が', 'を', 'に', 'で', 'と', 'も', 'の', 'へ', 'から', 'まで', 'より', 'か', 'や', 'には', 'では', 'とは', 'にも', 'でも'])
/** Pièges ajoutés quand il faut compléter les choix. */
const COMMON = ['が', 'を', 'に', 'で', 'と', 'は', 'の', 'も', 'へ', 'か']

/**
 * Si la correction ne change qu'une particule, rend ce qui l'entoure et les deux particules.
 * Ex. 会話をするのを緊張 → 会話をするのに緊張 : { prefix: 会話をするの, wrong: を, right: に, suffix: 緊張 }.
 */
export function particleSwap(
  original: string,
  fixed: string,
): { prefix: string; suffix: string; wrong: string; right: string } | null {
  let i = 0
  while (i < original.length && i < fixed.length && original[i] === fixed[i]) i++
  let j = 0
  while (
    j < original.length - i &&
    j < fixed.length - i &&
    original[original.length - 1 - j] === fixed[fixed.length - 1 - j]
  )
    j++
  for (let a = i; a >= Math.max(0, i - 2); a--) {
    for (let b = j; b >= Math.max(0, j - 2); b--) {
      const wrong = original.slice(a, original.length - b)
      const right = fixed.slice(a, fixed.length - b)
      if (wrong !== right && KNOWN.has(wrong) && KNOWN.has(right)) {
        return {
          prefix: original.slice(0, a),
          suffix: original.slice(original.length - b),
          wrong,
          right,
        }
      }
    }
  }
  return null
}

interface Collocation {
  before: string
  answer: string
  after: string
  wrong: string[]
  /** Rappel en français : le verbe et sa particule. */
  note: string
}

/** Verbes et expressions qui demandent une particule précise (niveau N4-N3). */
const COLLOCATIONS: Collocation[] = [
  { before: '友達', answer: 'に', after: '会いました。', wrong: ['を', 'が', 'と'], note: '〜に会う : rencontrer quelqu’un.' },
  { before: '電車', answer: 'に', after: '乗ります。', wrong: ['を', 'で', 'が'], note: '〜に乗る : monter dans un véhicule.' },
  { before: '先生', answer: 'に', after: '質問します。', wrong: ['を', 'が', 'と'], note: '〜に質問する : poser une question à quelqu’un.' },
  { before: '日本語', answer: 'に', after: '興味があります。', wrong: ['を', 'が', 'で'], note: '〜に興味がある : s’intéresser à.' },
  { before: '新しい生活', answer: 'に', after: '慣れました。', wrong: ['を', 'が', 'で'], note: '〜に慣れる : s’habituer à.' },
  { before: '母', answer: 'に', after: '似ています。', wrong: ['と', 'を', 'が'], note: '〜に似ている : ressembler à.' },
  { before: '会議', answer: 'に', after: '参加します。', wrong: ['を', 'で', 'が'], note: '〜に参加する : participer à.' },
  { before: '田中さん', answer: 'と', after: '結婚しました。', wrong: ['に', 'を', 'が'], note: '〜と結婚する : se marier avec.' },
  { before: '道', answer: 'に', after: '迷いました。', wrong: ['を', 'が', 'で'], note: '〜に迷う : se perdre (dans un lieu).' },
  { before: '友達', answer: 'を', after: '待っています。', wrong: ['に', 'が', 'と'], note: '〜を待つ : attendre quelqu’un.' },
  { before: '試合', answer: 'に', after: '勝ちました。', wrong: ['を', 'が', 'で'], note: '〜に勝つ : gagner contre / remporter.' },
  { before: '大学', answer: 'に', after: '入ります。', wrong: ['を', 'で', 'が'], note: '〜に入る : entrer dans, s’inscrire à.' },
  { before: '家', answer: 'を', after: '出ます。', wrong: ['に', 'で', 'が'], note: '〜を出る : quitter un lieu.' },
  { before: '間違い', answer: 'に', after: '気づきました。', wrong: ['を', 'が', 'で'], note: '〜に気づく : remarquer.' },
  { before: '体', answer: 'に', after: '気をつけてください。', wrong: ['を', 'が', 'で'], note: '〜に気をつける : faire attention à.' },
  { before: '彼', answer: 'が', after: '好きです。', wrong: ['を', 'に', 'で'], note: '〜が好き : aimer (la chose aimée prend が).' },
  { before: '日本語', answer: 'が', after: 'わかります。', wrong: ['を', 'に', 'で'], note: '〜がわかる : comprendre.' },
  { before: '試験', answer: 'に', after: '緊張しています。', wrong: ['を', 'が', 'で'], note: '〜に緊張する : être nerveux face à.' },
  { before: '朝ごはん', answer: 'と', after: '関係ありません。', wrong: ['に', 'を', 'が'], note: '〜と関係ない : n’avoir aucun rapport avec.' },
  { before: '橋', answer: 'を', after: '渡ります。', wrong: ['に', 'で', 'が'], note: '〜を渡る : traverser.' },
  { before: '角', answer: 'を', after: '曲がります。', wrong: ['に', 'で', 'が'], note: '〜を曲がる : tourner à un angle.' },
  { before: 'ドア', answer: 'が', after: '開きます。', wrong: ['を', 'に', 'で'], note: '開く (intransitif) : la chose qui s’ouvre prend が.' },
  { before: '電気', answer: 'を', after: 'つけます。', wrong: ['が', 'に', 'で'], note: 'つける (transitif) : ce qu’on allume prend を.' },
  { before: '先生', answer: 'に', after: 'ほめられました。', wrong: ['を', 'が', 'と'], note: '受け身 : la personne qui agit prend に.' },
  { before: '駅', answer: 'まで', after: '歩きました。', wrong: ['に', 'を', 'で'], note: '〜まで : jusqu’à (limite d’une action).' },
  { before: 'ここ', answer: 'に', after: '荷物を置きます。', wrong: ['で', 'を', 'が'], note: '〜に置く : poser à un endroit.' },
  { before: '何を食べる', answer: 'か', after: '迷っています。', wrong: ['と', 'を', 'が'], note: '〜か迷う : hésiter sur (une question).' },
  { before: '病気', answer: 'で', after: '学校を休みました。', wrong: ['に', 'を', 'が'], note: '〜で : cause (maladie, pluie…).' },
  { before: '鉛筆', answer: 'で', after: '書きます。', wrong: ['に', 'を', 'と'], note: '〜で : moyen, instrument.' },
  { before: '一人', answer: 'で', after: '行きます。', wrong: ['に', 'と', 'を'], note: '〜で : manière (seul, à deux…).' },
]

interface Candidate {
  key: string
  weight: number
  question: QuizQuestion
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

function options(right: string, wrong: string[], rand: () => number): string[] {
  const set = new Set([right, ...wrong])
  for (const c of shuffle(COMMON, rand)) {
    if (set.size >= 4) break
    set.add(c)
  }
  return shuffle([...set].slice(0, 4), rand)
}

/** Les questions possibles : tes erreurs de particule d'abord, puis la liste des verbes. */
export function particleCandidates(
  entries: Entry[],
  history: QuizHistory,
  rand: () => number,
  now: number,
): Candidate[] {
  const out: Candidate[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    const c = entry.correction
    if (!c) continue
    for (const e of c.errors) {
      const fixed = plainText(e.corrected).trim()
      const swap = particleSwap(e.original.trim(), fixed)
      if (!swap) continue
      const key = `p|${e.original.trim()}→${fixed}`
      if (seen.has(key) || history[key]?.hidden) continue
      seen.add(key)
      const sentence = c.sourceText
        .split(/(?<=[。！？!?\n])/)
        .find((s) => s.includes(e.original.trim()))
        ?.trim()
      const context = (sentence ?? e.original.trim()).replace(
        e.original.trim(),
        `${swap.prefix}${BLANK}${swap.suffix}`,
      )
      out.push({
        key,
        weight: weightFrom(3, key, history, now),
        question: {
          item: {
            key,
            entryId: entry.id,
            kind: 'particule',
            original: swap.wrong,
            corrected: swap.right,
            correctPlain: swap.right,
            explanation: e.explanation,
            context,
          },
          options: options(swap.right, [swap.wrong], rand),
        },
      })
    }
  }
  for (const col of COLLOCATIONS) {
    const key = `p|${col.before}${col.answer}${col.after}`
    if (history[key]?.hidden) continue
    out.push({
      key,
      weight: weightFrom(1, key, history, now),
      question: {
        item: {
          key,
          entryId: '',
          kind: 'particule',
          original: col.wrong[0],
          corrected: col.answer,
          correctPlain: col.answer,
          explanation: col.note,
          context: `${col.before}${BLANK}${col.after}`,
        },
        options: options(col.answer, col.wrong.slice(0, 3), rand),
      },
    })
  }
  return out
}

/** Dix questions : tes erreurs reviennent en priorité, la liste complète le reste. */
export function buildParticleDrill(
  entries: Entry[],
  history: QuizHistory,
  count = 10,
  rand: () => number = Math.random,
  now = Date.now(),
): QuizQuestion[] {
  const pool = particleCandidates(entries, history, rand, now)
  const chosen: QuizQuestion[] = []
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
    chosen.push(pool.splice(index, 1)[0].question)
  }
  return chosen
}

/** Combien de tes propres erreurs peuvent servir de question. */
export function ownParticleCount(entries: Entry[]): number {
  let n = 0
  const seen = new Set<string>()
  for (const entry of entries)
    for (const e of entry.correction?.errors ?? []) {
      const fixed = plainText(e.corrected).trim()
      const key = `${e.original.trim()}→${fixed}`
      if (!seen.has(key) && particleSwap(e.original.trim(), fixed)) {
        seen.add(key)
        n++
      }
    }
  return n
}

/**
 * Questions liées à une faute de particule : la faute elle-même d'abord, puis des verbes
 * qui demandent la même particule. Rend null si la correction ne change pas une particule.
 */
export function particleQuestionsFor(
  e: CorrectionItem,
  sourceText: string,
  history: QuizHistory,
  count = 3,
  rand: () => number = Math.random,
): QuizQuestion[] | null {
  const original = e.original.trim()
  const fixed = plainText(e.corrected).trim()
  const swap = particleSwap(original, fixed)
  if (!swap) return null
  const key = `p|${original}→${fixed}`
  const sentence = sourceText.split(/(?<=[。！？!?\n])/).find((s) => s.includes(original))?.trim()
  const context = (sentence ?? original).replace(original, `${swap.prefix}${BLANK}${swap.suffix}`)
  const own: QuizQuestion = {
    item: {
      key,
      entryId: '',
      kind: 'particule',
      original: swap.wrong,
      corrected: swap.right,
      correctPlain: swap.right,
      explanation: e.explanation,
      context,
    },
    options: options(swap.right, [swap.wrong], rand),
  }
  const same = COLLOCATIONS.filter((c) => c.answer === swap.right && !history[`p|${c.before}${c.answer}${c.after}`]?.hidden)
  const more = shuffle(same, rand)
    .slice(0, Math.max(0, count - 1))
    .map<QuizQuestion>((col) => ({
      item: {
        key: `p|${col.before}${col.answer}${col.after}`,
        entryId: '',
        kind: 'particule',
        original: col.wrong[0],
        corrected: col.answer,
        correctPlain: col.answer,
        explanation: col.note,
        context: `${col.before}${BLANK}${col.after}`,
      },
      options: options(col.answer, col.wrong.slice(0, 3), rand),
    }))
  return [own, ...more]
}
