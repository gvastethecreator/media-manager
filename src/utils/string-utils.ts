/**
 * @file Utilidades para manipulación de strings
 * @module utils/string-utils
 * @description Funciones auxiliares para trabajar con cadenas de texto, como generar colores o emojis.
 */

/**
 * 🎨 Genera un color hexadecimal consistente a partir de un string.
 * @param name - El string de entrada.
 * @returns Un código de color en formato hexadecimal.
 */
export function generateTagColor(name: string): string {
  if (!name) return '#3b82f6'; // Color por defecto

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convertir a 32bit integer
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }

  return color;
}

/**
 * 😂 Genera un emoji a partir de un string y una categoría opcional.
 * @param name - El string de entrada.
 * @param category - La categoría para acotar la selección de emojis.
 * @returns Un emoji.
 */
export function generateTagEmoji(name: string, category?: string): string {
  // Lógica simple por ahora, se puede expandir
  if (!name) return '🏷️';

  const emojis = ['🎨', '💡', '🚀', '⭐', '🔧', '📁', '👤', '🌍', '📚', '⚙️'];
  const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return emojis[charCodeSum % emojis.length];
}
