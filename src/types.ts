export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
export type Level = JlptLevel

/**
 * Seuil d'affichage des furigana : on affiche la lecture des mots
 * de ce niveau ou plus difficiles.
 *  - 'all'  : tous les mots avec kanji
 *  - 'N3'   : N3, N2, N1
 *  - 'N2'   : N2, N1
 *  - 'N1'   : N1 uniquement
 *  - 'none' : jamais
 */
export type FuriganaFrom = 'all' | 'N3' | 'N2' | 'N1' | 'none'

export type Theme = 'auto' | 'light' | 'dark'

export interface Settings {
  /** Clé API Claude, stockée uniquement sur ce téléphone. */
  apiKey: string
  /** Identifiant du modèle utilisé pour la correction. */
  model: string
  /** Niveau visé pour les prompts et les explications. */
  targetLevel: 'N4' | 'N3' | 'N2'
  furiganaFrom: FuriganaFrom
  /** Apparence : suit le téléphone, ou clair / sombre imposé. */
  theme: Theme
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'claude-sonnet-5-5',
  targetLevel: 'N3',
  furiganaFrom: 'N2',
  theme: 'light',
}

export type ErrorKind =
  | 'particule'
  | 'conjugaison'
  | 'vocabulaire'
  | 'grammaire'
  | 'registre'
  | 'orthographe'
  | 'naturel'

export const ERROR_KINDS: ErrorKind[] = [
  'particule',
  'conjugaison',
  'vocabulaire',
  'grammaire',
  'registre',
  'orthographe',
  'naturel',
]

/**
 * Les textes japonais d'une correction contiennent un balisage de furigana :
 * {漢字|かんじ|N4} = kanji, lecture, niveau JLPT du mot. Voir furigana.tsx.
 */
export interface CorrectionItem {
  kind: ErrorKind
  /** Passage fautif, recopié tel que l'apprenant l'a écrit (texte brut). */
  original: string
  corrected: string
  explanation: string
}

export interface GrammarGood {
  point: string
  note: string
}

export interface GrammarReview {
  point: string
  note: string
  example: string
}

export interface Correction {
  /** Texte corrigé : sert à repérer une correction devenue périmée. */
  sourceText: string
  summary: string
  natural: string
  errors: CorrectionItem[]
  grammarGood: GrammarGood[]
  grammarReview: GrammarReview[]
  model: string
  createdAt: number
}

/** Idée du jour proposée à l'apprenant(e) : sujet, point de grammaire, mots. */
export interface DailyPrompt {
  /** 0 pour la première idée du jour, +1 à chaque « Autre idée ». */
  variant: number
  topic: { ja: string; fr: string }
  grammar: {
    pattern: string
    fr: string
    level: 'N4' | 'N3' | 'N2'
    example: string
    exampleFr: string
    /** Point tiré de ton deck Anki plutôt que de la liste intégrée. */
    fromAnki?: boolean
    /** Point à viser choisi par le bilan de la semaine. */
    fromReview?: boolean
  }
  /** `reading` est vide quand le mot n'a pas de kanji. */
  words: { ja: string; reading: string; fr: string }[]
}

/** Photo collée dans une entrée, réduite et stockée en JPEG (data URL). */
export interface EntryPhoto {
  id: string
  src: string
}

/** Autocollant posé sur la page (voir components/stickers.tsx). */
export interface EntrySticker {
  id: string
  kind: string
}

export interface Entry {
  /** Date locale au format YYYY-MM-DD : une seule entrée par jour. */
  id: string
  text: string
  createdAt: number
  updatedAt: number
  correction?: Correction | null
  /** Idée du jour choisie pour cette entrée (absente si aucune). */
  prompt?: DailyPrompt | null
  photos?: EntryPhoto[]
  stickers?: EntrySticker[]
  /** Correction demandée sans réseau : elle part à la prochaine ouverture connectée. */
  pendingCorrection?: boolean
  /** Dernier échec de correction, à afficher sous le texte. */
  correctionError?: string
}

/** Notes importées depuis Anki (export texte), utilisées pour enrichir les idées du jour. */
export interface AnkiGrammar {
  deck: string
  pattern: string
  fr: string
  level: 'N4' | 'N3' | 'N2'
  example: string
  exampleFr: string
}

export interface AnkiWord {
  deck: string
  ja: string
  reading: string
  fr: string
}

export interface AnkiDeckInfo {
  name: string
  kind: 'grammar' | 'vocab'
  count: number
  /** Décoché : les notes restent importées mais ne sont plus proposées. */
  enabled: boolean
}

export interface AnkiLibrary {
  importedAt: number
  decks: AnkiDeckInfo[]
  grammar: AnkiGrammar[]
  words: AnkiWord[]
}

/** Bilan de la semaine rédigé par Claude. Les textes japonais sont balisés en furigana. */
export interface WeeklyReview {
  createdAt: number
  /** Période couverte (YYYY-MM-DD, bornes comprises). */
  from: string
  to: string
  /** Nombre d'entrées lues. */
  entryCount: number
  model: string
  /** Bilan général, en français. */
  summary: string
  /** Erreurs qui reviennent. */
  recurring: { point: string; explanation: string; wrong: string; right: string }[]
  /** Ce qui progresse. */
  progress: string[]
  /** Point de grammaire à viser la semaine suivante. */
  focus: {
    pattern: string
    fr: string
    level: 'N4' | 'N3' | 'N2'
    why: string
    example: string
    exampleFr: string
  }
}
