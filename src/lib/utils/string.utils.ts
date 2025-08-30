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
	if (!name) {
		return '#3b82f6'; // Color por defecto
	}

	// Hash sin bitwise: acumulación multiplicativa con módulo de 2^32
	let hash = 2_166_136_261; // offset basis FNV-like
	for (let i = 0; i < name.length; i++) {
		const code = name.charCodeAt(i);
		hash = (hash * 16_777_619) % 4_294_967_296; // 2^32
		hash = (hash + code) % 4_294_967_296;
	}

	// Derivar 3 bytes del hash usando divisiones/módulos
	const b1 = Math.floor(hash % 256);
	const b2 = Math.floor((hash / 256) % 256);
	const b3 = Math.floor((hash / 65_536) % 256);

	const toHex = (n: number) => n.toString(16).padStart(2, '0');
	return `#${toHex(b1)}${toHex(b2)}${toHex(b3)}`;
}

/**
 * 😂 Genera un emoji a partir de un string y una categoría opcional.
 * @param name - El string de entrada.
 * @param category - La categoría para acotar la selección de emojis.
 * @returns Un emoji.
 */
export function generateTagEmoji(name: string, _category?: string): string {
	// Lógica simple por ahora, se puede expandir
	if (!name) {
		return '🏷️';
	}

	const emojis = ['🎨', '💡', '🚀', '⭐', '🔧', '📁', '👤', '🌍', '📚', '⚙️'];
	const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

	return emojis[charCodeSum % emojis.length];
}
