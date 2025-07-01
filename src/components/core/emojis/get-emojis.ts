/**
 * @file Utilidades para obtener emojis
 * @module components/core/emojis/get-emojis
 */

export interface EmojiData {
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
}

export const emojiCategories = {
  people: '👥 Personas',
  nature: '🌿 Naturaleza',
  food: '🍕 Comida',
  travel: '✈️ Viajes',
  activities: '⚽ Actividades',
  objects: '📱 Objetos',
  symbols: '❤️ Símbolos',
  flags: '🏁 Banderas',
} as const;

export type EmojiCategory = keyof typeof emojiCategories;

// Lista básica de emojis comúnmente utilizados
export const commonEmojis: EmojiData[] = [
  { emoji: '😀', name: 'cara sonriente', category: 'people', keywords: ['feliz', 'sonrisa'] },
  { emoji: '😍', name: 'cara con ojos de corazón', category: 'people', keywords: ['amor', 'enamorado'] },
  { emoji: '🤔', name: 'cara pensativa', category: 'people', keywords: ['pensar', 'duda'] },
  { emoji: '👍', name: 'pulgar arriba', category: 'people', keywords: ['bien', 'aprobación'] },
  { emoji: '❤️', name: 'corazón rojo', category: 'symbols', keywords: ['amor', 'corazón'] },
  { emoji: '🔥', name: 'fuego', category: 'nature', keywords: ['caliente', 'popular'] },
  { emoji: '⭐', name: 'estrella', category: 'symbols', keywords: ['favorito', 'estrella'] },
  { emoji: '🎉', name: 'confeti', category: 'activities', keywords: ['celebración', 'fiesta'] },
  { emoji: '📸', name: 'cámara', category: 'objects', keywords: ['foto', 'imagen'] },
  { emoji: '🎨', name: 'paleta de artista', category: 'activities', keywords: ['arte', 'creatividad'] },
];

/**
 * Obtiene todos los emojis disponibles
 */
export function getAllEmojis(): EmojiData[] {
  return commonEmojis;
}

/**
 * Obtiene emojis por categoría
 */
export function getEmojisByCategory(category: EmojiCategory): EmojiData[] {
  return commonEmojis.filter(emoji => emoji.category === category);
}

/**
 * Busca emojis por texto
 */
export function searchEmojis(query: string): EmojiData[] {
  const searchTerm = query.toLowerCase();

  return commonEmojis.filter(emoji =>
    emoji.name.toLowerCase().includes(searchTerm) ||
    emoji.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
  );
}

/**
 * Obtiene un emoji aleatorio
 */
export function getRandomEmoji(): EmojiData {
  return commonEmojis[Math.floor(Math.random() * commonEmojis.length)];
}

/**
 * Valida si un texto es un emoji válido
 */
export function isValidEmoji(text: string): boolean {
  return commonEmojis.some(emoji => emoji.emoji === text);
}