/**
 * Moteur de conjugaison du japonais : un verbe (écriture + lecture + groupe) donne ses formes.
 * Tout est calculé ici, sans API : chaque réponse attendue est donc exacte.
 */

export type Group = 'godan' | 'ichidan' | 'suru' | 'kuru'

export interface Verb {
  /** Forme du dictionnaire, telle qu'elle est écrite (食べる). */
  ja: string
  /** Lecture en hiragana (たべる). */
  reading: string
  fr: string
  group: Group
}

export type FormId =
  | 'nai'
  | 'nakatta'
  | 'naide'
  | 'ta'
  | 'te'
  | 'ba'
  | 'tara'
  | 'tai'
  | 'potential'
  | 'passive'
  | 'causative'
  | 'causativePassive'
  | 'volitional'
  | 'imperative'
  | 'prohibitive'

export interface FormInfo {
  id: FormId
  /** Nom court, en japonais. */
  ja: string
  fr: string
  /** Palier de déblocage (1 = d'abord, 4 = en dernier). */
  stage: number
}

/** Les formes travaillées (ni la forme du dictionnaire ni la forme en ます). */
export const FORMS: FormInfo[] = [
  { id: 'nai', ja: 'ない形', fr: 'négatif (ne … pas)', stage: 1 },
  { id: 'ta', ja: 'た形', fr: 'passé', stage: 1 },
  { id: 'te', ja: 'て形', fr: 'forme en て', stage: 1 },
  { id: 'nakatta', ja: 'なかった形', fr: 'passé négatif', stage: 2 },
  { id: 'naide', ja: 'ないで形', fr: 'sans faire (ないで)', stage: 2 },
  { id: 'ba', ja: 'ば形', fr: 'condition (si…)', stage: 2 },
  { id: 'tai', ja: 'たい形', fr: 'vouloir faire', stage: 2 },
  { id: 'potential', ja: '可能形', fr: 'potentiel (pouvoir faire)', stage: 3 },
  { id: 'passive', ja: '受身形', fr: 'passif', stage: 3 },
  { id: 'causative', ja: '使役形', fr: 'causatif (faire faire)', stage: 3 },
  { id: 'tara', ja: 'たら形', fr: 'condition (quand / si, たら)', stage: 4 },
  { id: 'causativePassive', ja: '使役受身形', fr: 'causatif passif (être obligé de)', stage: 4 },
  { id: 'volitional', ja: '意向形', fr: 'volitif (allons…, je vais…)', stage: 4 },
  { id: 'imperative', ja: '命令形', fr: 'impératif (ordre)', stage: 4 },
  { id: 'prohibitive', ja: '禁止形', fr: 'interdiction (ne fais pas)', stage: 4 },
]

export const MAX_STAGE = 4

export function formInfo(id: FormId): FormInfo {
  return FORMS.find((f) => f.id === id)!
}

export const GROUP_LABEL: Record<Group, string> = {
  godan: 'Groupe 1 (五段, verbes en う)',
  ichidan: 'Groupe 2 (一段, verbes en る)',
  suru: 'Irrégulier : する',
  kuru: 'Irrégulier : 来る',
}

// ------------------------------------------------------------------ kana

const A: Record<string, string> = { う: 'わ', く: 'か', ぐ: 'が', す: 'さ', つ: 'た', ぬ: 'な', ぶ: 'ば', む: 'ま', る: 'ら' }
const I: Record<string, string> = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' }
const E: Record<string, string> = { う: 'え', く: 'け', ぐ: 'げ', す: 'せ', つ: 'て', ぬ: 'ね', ぶ: 'べ', む: 'め', る: 'れ' }
const O: Record<string, string> = { う: 'お', く: 'こ', ぐ: 'ご', す: 'そ', つ: 'と', ぬ: 'の', ぶ: 'ぼ', む: 'も', る: 'ろ' }
const TE: Record<string, string> = { う: 'って', つ: 'って', る: 'って', む: 'んで', ぶ: 'んで', ぬ: 'んで', く: 'いて', ぐ: 'いで', す: 'して' }

export function isIku(v: Verb): boolean {
  return v.group === 'godan' && (v.ja.endsWith('行く') || v.ja === 'いく')
}

/** Une même suite de kana pour l'écriture et pour la lecture. */
function build(v: Verb, tail: string | ((reading: boolean) => string), prefix?: { ja: string; reading: string }): { ja: string; reading: string } {
  const t = (r: boolean) => (typeof tail === 'string' ? tail : tail(r))
  const p = prefix ?? { ja: v.ja.slice(0, -1), reading: v.reading.slice(0, -1) }
  return { ja: p.ja + t(false), reading: p.reading + t(true) }
}

export interface Conjugated {
  /** Écriture (avec kanji) et lecture (kana). */
  ja: string
  reading: string
  /** Autres réponses acceptées (écriture et lecture). */
  alternatives: string[]
}

/** La forme demandée, ou `null` si ce verbe n'a pas cette forme (ある à la forme négative…). */
export function conjugate(v: Verb, form: FormId): Conjugated | null {
  if (v.group === 'suru') {
    const noun = { ja: v.ja.replace(/する$/, ''), reading: v.reading.replace(/する$/, '') }
    const f: Record<FormId, string> = {
      nai: 'しない',
      nakatta: 'しなかった',
      naide: 'しないで',
      ta: 'した',
      te: 'して',
      ba: 'すれば',
      tara: 'したら',
      tai: 'したい',
      potential: 'できる',
      passive: 'される',
      causative: 'させる',
      causativePassive: 'させられる',
      volitional: 'しよう',
      imperative: 'しろ',
      prohibitive: 'するな',
    }
    return { ...build(v, f[form], noun), alternatives: [] }
  }

  if (v.group === 'kuru') {
    const kanji = v.ja.endsWith('来る')
    const front = v.ja.slice(0, -2)
    const frontReading = v.reading.slice(0, -2)
    const stem = (kana: string) => ({ ja: front + (kanji ? '来' : kana), reading: frontReading + kana })
    const f: Record<FormId, [string, string]> = {
      nai: ['こ', 'ない'],
      nakatta: ['こ', 'なかった'],
      naide: ['こ', 'ないで'],
      ta: ['き', 'た'],
      te: ['き', 'て'],
      ba: ['く', 'れば'],
      tara: ['き', 'たら'],
      tai: ['き', 'たい'],
      potential: ['こ', 'られる'],
      passive: ['こ', 'られる'],
      causative: ['こ', 'させる'],
      causativePassive: ['こ', 'させられる'],
      volitional: ['こ', 'よう'],
      imperative: ['こ', 'い'],
      prohibitive: ['く', 'るな'],
    }
    const [kana, rest] = f[form]
    const s = stem(kana)
    return { ja: s.ja + rest, reading: s.reading + rest, alternatives: [] }
  }

  if (v.group === 'ichidan') {
    const f: Record<FormId, string> = {
      nai: 'ない',
      nakatta: 'なかった',
      naide: 'ないで',
      ta: 'た',
      te: 'て',
      ba: 'れば',
      tara: 'たら',
      tai: 'たい',
      potential: 'られる',
      passive: 'られる',
      causative: 'させる',
      causativePassive: 'させられる',
      volitional: 'よう',
      imperative: 'ろ',
      prohibitive: 'る',
    }
    // 禁止形 = dictionnaire + な : on garde le る.
    if (form === 'prohibitive') return { ja: v.ja + 'な', reading: v.reading + 'な', alternatives: [] }
    return { ...build(v, f[form]), alternatives: [] }
  }

  // godan
  const last = v.ja.slice(-1)
  if (!A[last]) return null
  if (v.ja === 'ある' || v.ja === '有る' || v.ja === '在る') {
    if (form === 'nai' || form === 'nakatta' || form === 'naide') return null
  }
  const te = isIku(v) ? 'って' : TE[last]
  const ta = te.replace('て', 'た').replace('で', 'だ')
  const f: Record<FormId, string> = {
    nai: A[last] + 'ない',
    nakatta: A[last] + 'なかった',
    naide: A[last] + 'ないで',
    ta,
    te,
    ba: E[last] + 'ば',
    tara: ta + 'ら',
    tai: I[last] + 'たい',
    potential: E[last] + 'る',
    passive: A[last] + 'れる',
    causative: A[last] + 'せる',
    causativePassive: last === 'す' ? A[last] + 'せられる' : A[last] + 'される',
    volitional: O[last] + 'う',
    imperative: E[last],
    prohibitive: '',
  }
  if (form === 'prohibitive') return { ja: v.ja + 'な', reading: v.reading + 'な', alternatives: [] }
  const result = build(v, f[form])
  const alternatives: string[] = []
  if (form === 'causativePassive' && last !== 'す') {
    const long = build(v, A[last] + 'せられる')
    alternatives.push(long.ja, long.reading)
  }
  return { ...result, alternatives }
}

/** Les réponses qu'on accepte, sans espaces. */
export function acceptedAnswers(v: Verb, form: FormId): string[] {
  const c = conjugate(v, form)
  if (!c) return []
  return [...new Set([c.ja, c.reading, ...c.alternatives])]
}

/** Vérifie une réponse tapée. */
export function checkAnswer(v: Verb, form: FormId, typed: string): boolean {
  const clean = typed.normalize('NFKC').replace(/\s+/g, '')
  if (!clean) return false
  return acceptedAnswers(v, form).some((a) => a.normalize('NFKC') === clean)
}

// ------------------------------------------------------------------ explications

const ENDING_NOTE: Record<string, string> = {
  う: 'う・つ・る → って / った',
  つ: 'う・つ・る → って / った',
  る: 'う・つ・る → って / った',
  む: 'む・ぶ・ぬ → んで / んだ',
  ぶ: 'む・ぶ・ぬ → んで / んだ',
  ぬ: 'む・ぶ・ぬ → んで / んだ',
  く: 'く → いて / いた',
  ぐ: 'ぐ → いで / いだ',
  す: 'す → して / した',
}

/** La règle à retenir, en français, pour cette forme de ce verbe. */
export function explain(v: Verb, form: FormId): string {
  const group = GROUP_LABEL[v.group]
  const last = v.ja.slice(-1)
  const info = formInfo(form)
  let rule: string
  if (v.group === 'suru') {
    rule = `Avec 〜する, seule la partie する change (して, しない, すれば, できる pour le potentiel, される, させる).`
  } else if (v.group === 'kuru') {
    rule = '来る est irrégulier : き (て・た・たい), こ (ない・passif・potentiel・causatif・volitif・impératif), く (ば・禁止).'
  } else if (v.group === 'ichidan') {
    const rules: Record<FormId, string> = {
      nai: 'On enlève る, on ajoute ない.',
      nakatta: 'On enlève る, on ajoute なかった.',
      naide: 'On enlève る, on ajoute ないで.',
      ta: 'On enlève る, on ajoute た.',
      te: 'On enlève る, on ajoute て.',
      ba: 'On enlève る, on ajoute れば.',
      tara: 'On enlève る, on ajoute たら.',
      tai: 'On enlève る, on ajoute たい.',
      potential: 'On enlève る, on ajoute られる (même forme que le passif).',
      passive: 'On enlève る, on ajoute られる (même forme que le potentiel).',
      causative: 'On enlève る, on ajoute させる.',
      causativePassive: 'On enlève る, on ajoute させられる.',
      volitional: 'On enlève る, on ajoute よう.',
      imperative: 'On enlève る, on ajoute ろ.',
      prohibitive: 'Forme du dictionnaire + な.',
    }
    rule = rules[form]
  } else {
    const row = (map: Record<string, string>, label: string) => `${last} → ${map[last]} (ligne ${label})`
    const rules: Record<FormId, string> = {
      nai: `${row(A, 'あ')} + ない (う devient わ).`,
      nakatta: `${row(A, 'あ')} + なかった (う devient わ).`,
      naide: `${row(A, 'あ')} + ないで (う devient わ).`,
      ta: `Selon la finale : ${ENDING_NOTE[last]}.${isIku(v) ? ' Exception : 行く → 行って / 行った.' : ''}`,
      te: `Selon la finale : ${ENDING_NOTE[last]}.${isIku(v) ? ' Exception : 行く → 行って / 行った.' : ''}`,
      ba: `${row(E, 'え')} + ば.`,
      tara: `Forme en た + ら.`,
      tai: `${row(I, 'い')} + たい.`,
      potential: `${row(E, 'え')} + る.`,
      passive: `${row(A, 'あ')} + れる.`,
      causative: `${row(A, 'あ')} + せる.`,
      causativePassive:
        last === 'す' ? `${row(A, 'あ')} + せられる (les verbes en す n'ont que cette forme).` : `${row(A, 'あ')} + される (ou せられる, plus long).`,
      volitional: `${row(O, 'お')} + う.`,
      imperative: `${row(E, 'え')}, sans rien ajouter.`,
      prohibitive: 'Forme du dictionnaire + な.',
    }
    rule = rules[form]
  }
  return `${group} — ${info.ja} : ${rule}`
}

/** Les verbes en る dont la finale trompe : on les révise plus souvent. */
export function isTricky(v: Verb): boolean {
  if (v.group === 'godan') return (v.ja.endsWith('る') && /[いきしちにひみりぎじぢびぴえけせてねへめれげぜでべぺ]る$/.test(v.reading)) || isIku(v)
  if (v.group === 'ichidan') return /[いきしちにひみりぎじぢびぴえけせてねへめれげぜでべぺ]る$/.test(v.reading)
  return false
}
