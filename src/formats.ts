/*
  Format d'écriture du jour (S5.4a) : un format différent chaque jour, sans rien à choisir.

  Le tirage ne dépend que de la date : il est le même toute la journée (même si on rouvre l'appli),
  il ne revient jamais deux jours de suite, et les six formats passent à tour de rôle, dans un
  ordre mélangé à chaque tour de six jours. Rien n'est enregistré pour le calculer.
*/

export type FormatId = 'journal' | 'lettre' | 'avis' | 'dialogue' | 'description' | 'opinion'

export interface FormatStarter {
  /** Texte balisé de furigana ({漢字|かんじ}). */
  ja: string
  fr: string
}

export interface Format {
  id: FormatId
  /** Nom en japonais (pastille). */
  ja: string
  fr: string
  /** Consigne courte, en français. */
  consigne: string
  /** Contexte donné à Claude pour la correction (S5.4b) : jamais une note sur le respect du format. */
  hint: string
  /** Deux débuts de phrase à toucher (vide pour le journal libre : les amorces par thème existent déjà). */
  starters: FormatStarter[]
}

export const FORMATS: Format[] = [
  {
    id: 'journal',
    ja: '日記',
    fr: 'Journal libre',
    consigne: "Écris librement, comme d'habitude. Le thème du jour est là si tu veux.",
    hint: '',
    starters: [],
  },
  {
    id: 'lettre',
    ja: '手紙',
    fr: 'Lettre',
    consigne: "Réponds à cette lettre, d'un ton poli.",
    hint: "une lettre (réponse à une lettre reçue) : le registre poli et les formules de lettre sont attendus",
    starters: [
      { ja: '〇〇さんへ。お{手紙|てがみ}をありがとうございます。', fr: 'À …, merci pour ta lettre.' },
      { ja: '{最近|さいきん}、', fr: 'Ces temps-ci, …' },
    ],
  },
  {
    id: 'avis',
    ja: '感想',
    fr: 'Avis',
    consigne: "Dis ce que c'est, ce que tu as aimé (ou moins), et si tu le recommandes. Deux raisons au moins.",
    hint: "un avis personnel (ce qu'on a aimé ou moins aimé, et si on recommande)",
    starters: [
      { ja: '{私|わたし}のおすすめは、', fr: 'Ce que je recommande, c\'est …' },
      { ja: '{今|いま}までで{一番|いちばん}よかったのは、', fr: 'Le meilleur jusqu\'ici, c\'est …' },
    ],
  },
  {
    id: 'dialogue',
    ja: '会話',
    fr: 'Dialogue',
    consigne: 'Écris la réplique suivante, puis continue jusqu\'à six répliques en tout.',
    hint: 'un dialogue entre deux personnes (répliques entre 「」, langue parlée acceptée)',
    starters: [
      { ja: 'A「', fr: 'Réplique de A : …' },
      { ja: 'B「', fr: 'Réplique de B : …' },
    ],
  },
  {
    id: 'description',
    ja: '描写',
    fr: 'Description',
    consigne: 'Décris en 3 à 5 phrases : ce que tu vois, ce que tu entends, ce que tu ressens.',
    hint: 'une description (ce qu\'on voit, entend ou ressent)',
    starters: [
      { ja: '{私|わたし}の{目|め}の{前|まえ}には、', fr: 'Devant moi, il y a …' },
      { ja: '{全体|ぜんたい}の{雰囲気|ふんいき}は、', fr: "L'ambiance générale, …" },
    ],
  },
  {
    id: 'opinion',
    ja: '意見',
    fr: 'Opinion',
    consigne: 'Dis si tu es d\'accord ou non, avec deux raisons.',
    hint: 'une opinion argumentée (accord ou désaccord, avec des raisons)',
    starters: [
      { ja: '{私|わたし}は〜と{思|おも}います。', fr: 'Je pense que …' },
      { ja: '{理由|りゆう}は{二|ふた}つあります。{一|ひと}つ{目|め}は、', fr: 'Il y a deux raisons. La première, …' },
    ],
  },
]

export const FORMAT_IDS: FormatId[] = FORMATS.map((f) => f.id)

export function formatById(id: FormatId | undefined | null): Format {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0]
}

/** Numéro du jour (entier) d'une date locale YYYY-MM-DD. */
export function dayNumber(id: string): number {
  const [y, m, d] = id.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const N = FORMATS.length
const rawCache = new Map<number, number[]>()

/** Ordre mélangé des six formats pour un tour de six jours (le même à chaque fois pour un tour donné). */
function rawOrder(cycle: number): number[] {
  const known = rawCache.get(cycle)
  if (known) return known
  const rand = mulberry32(cycle * 7919 + 20261125)
  const order = Array.from({ length: N }, (_, i) => i)
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  rawCache.set(cycle, order)
  return order
}

/** Ordre du tour, sans jamais commencer par le dernier format du tour précédent. */
function cycleOrder(cycle: number): number[] {
  const order = [...rawOrder(cycle)]
  const previousLast = rawOrder(cycle - 1)[N - 1]
  if (order[0] === previousLast) [order[0], order[1]] = [order[1], order[0]]
  return order
}

/** Le format d'écriture d'un jour. */
export function formatOfDay(id: string): FormatId {
  const n = dayNumber(id)
  const cycle = Math.floor(n / N)
  const pos = ((n % N) + N) % N
  return FORMAT_IDS[cycleOrder(cycle)[pos]]
}
