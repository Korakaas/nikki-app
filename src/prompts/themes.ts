import { plainText } from '../furigana'
import type { ThemeId } from './data'

/**
 * Mots-clés par thème, pour relier les mots de ton deck au sujet du jour.
 * Français (le sens des cartes) et kanji (le mot lui-même).
 */
const KEYWORDS: Record<ThemeId, { fr: string[]; ja: string }> = {
  repas: {
    fr: ['manger', 'boire', 'repas', 'cuisin', 'riz', 'viande', 'poisson', 'legume', 'fruit', 'restaurant', 'gout', 'delicieu', 'cafe', 'the ', 'boisson', 'pain', 'faim', 'soif', 'plat', 'gateau', 'sucre', 'sel', 'epice', 'aliment', 'nourriture', 'dejeuner', 'diner', 'petit-dej', 'assiette', 'bol', 'cuire', 'frire', 'bouillir'],
    ja: '食飲料理味米肉魚野菜茶酒飯朝昼夜甘辛焼煮',
  },
  meteo: {
    fr: ['pluie', 'pleuvoir', 'soleil', 'vent', 'neige', 'nuage', 'temps', 'meteo', 'temperature', 'chaud', 'froid', 'frais', 'doux', 'humide', 'orage', 'typhon', 'saison', 'printemps', 'ete', 'automne', 'hiver', 'ciel', 'brouillard', 'tempete', 'degage', 'nuageux', 'geler', 'fondre', 'climat'],
    ja: '雨雪風天気晴曇温暑寒涼春夏秋冬空雲',
  },
  travail: {
    fr: ['travail', 'bureau', 'entreprise', 'societe', 'reunion', 'collegue', 'patron', 'chef', 'client', 'projet', 'tache', 'dossier', 'document', 'mail', 'ordinateur', 'etude', 'cours', 'examen', 'devoir', 'emploi', 'metier', 'salaire', 'heure', 'retard', 'fatigu', 'occupe', 'demission', 'embauche', 'stage', 'ecole', 'universite', 'professeur', 'etudiant'],
    ja: '仕事会社社員課長部長客資料勉強試験授業学校先生生宿題忙残業',
  },
  amis: {
    fr: ['ami', 'famille', 'parent', 'enfant', 'frere', 'soeur', 'mere', 'pere', 'voisin', 'rencontr', 'inviter', 'cadeau', 'anniversaire', 'amour', 'couple', 'mari', 'epouse', 'bebe', 'grand-', 'animal', 'chat', 'chien', 'present', 'aider', 'aide', 'remercier', 'conseil', 'promesse', 'proche', 'relation', 'bavarder'],
    ja: '友人家族親子兄姉弟妹母父夫妻彼猫犬会贈誕助',
  },
  sortie: {
    fr: ['voyage', 'train', 'gare', 'bus', 'metro', 'voiture', 'route', 'rue', 'quartier', 'ville', 'magasin', 'achat', 'acheter', 'vendre', 'marche', 'parc', 'musee', 'hotel', 'billet', 'aeroport', 'avion', 'balade', 'promen', 'sortir', 'visite', 'itineraire', 'carte', 'perdre', 'chemin', 'traverser', 'prendre le', 'arrivee', 'depart', 'circulation'],
    ja: '旅行電車駅車道町店買売歩公園館泊切符空港散乗降着出発',
  },
  sentiments: {
    fr: ['content', 'triste', 'heureu', 'joie', 'colere', 'peur', 'inquiet', 'anxie', 'stress', 'surpris', 'etonn', 'honte', 'fier', 'seul', 'solitude', 'ennui', 'ennuy', 'nostalg', 'espoir', 'souhait', 'reve', 'regret', 'decu', 'emu', 'touche', 'sentiment', 'emotion', 'humeur', 'moral', 'courage', 'confiance', 'jaloux', 'gene', 'soulage', 'fatigue'],
    ja: '嬉悲楽怒怖心不安気思感驚恥誇寂夢希望残念',
  },
  maison: {
    fr: ['maison', 'appartement', 'chambre', 'cuisine', 'salon', 'salle de bain', 'meuble', 'table', 'chaise', 'lit', 'porte', 'fenetre', 'menage', 'nettoy', 'ranger', 'lessive', 'laver', 'linge', 'poubelle', 'loyer', 'demenag', 'deco', 'lumiere', 'electri', 'douche', 'bain', 'dormir', 'sommeil', 'reveil', 'habiter', 'vivre', 'cle', 'jardin', 'plante'],
    ja: '家部屋台所窓戸机椅子掃除洗濯住寝起夜鍵庭',
  },
  loisirs: {
    fr: ['film', 'cinema', 'livre', 'lire', 'lecture', 'musique', 'chanson', 'chanter', 'jeu', 'jouer', 'sport', 'courir', 'nager', 'marcher', 'dessin', 'peinture', 'photo', 'appareil', 'serie', 'manga', 'anime', 'concert', 'passe-temps', 'hobby', 'loisir', 'collection', 'instrument', 'piano', 'guitare', 'danse', 'ecrire', 'ecouter', 'regarder', 'spectacle', 'theatre', 'video'],
    ja: '映画本読音楽歌遊運動泳走絵写真趣味漫画写楽',
  },
}

function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Affinité d'un mot avec le thème d'un sujet : 0 = aucun lien, 1 = lien par le sens
 * ou par un kanji du thème, +1 si le mot partage un kanji avec le sujet lui-même.
 */
export function themeAffinity(
  word: { ja: string; fr: string },
  theme: ThemeId,
  topicJa: string,
): number {
  const keys = KEYWORDS[theme]
  const fr = ` ${fold(word.fr)} `
  const ja = plainText(word.ja)
  let score = 0
  if (keys.fr.some((k) => fr.includes(fold(k)))) score++
  else if ([...ja].some((c) => keys.ja.includes(c))) score++
  const topicKanji = new Set([...plainText(topicJa)].filter((c) => /\p{Script=Han}/u.test(c)))
  if ([...ja].some((c) => topicKanji.has(c))) score++
  return score
}
