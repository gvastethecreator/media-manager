/**
 * Utilidades para el manejo de colores
 */

/**
 * Convierte un string RGB (formato "r, g, b") a formato HEX (#rrggbb)
 * @param rgbString String en formato "r, g, b" (ej: "59, 130, 246")
 * @returns String en formato HEX (ej: "#3b82f6")
 */
export function rgbStringToHex(rgbString: string): string {
	const [r, g, b] = rgbString.split(',').map((num) => Number.parseInt(num.trim(), 10));
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convierte un color HEX (#rrggbb) a formato string RGB ("r, g, b")
 * @param hex String en formato HEX (ej: "#3b82f6")
 * @returns String en formato "r, g, b" (ej: "59, 130, 246")
 */
export function hexToRgbString(hex: string): string {
	// Eliminar el # si existe
	const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

	const r = Number.parseInt(cleanHex.slice(0, 2), 16);
	const g = Number.parseInt(cleanHex.slice(2, 4), 16);
	const b = Number.parseInt(cleanHex.slice(4, 6), 16);

	return `${r}, ${g}, ${b}`;
}

/**
 * Convierte un string RGB (formato "r, g, b") a un objeto de color RGB
 * @param rgbString String en formato "r, g, b" (ej: "59, 130, 246")
 * @returns Objeto con propiedades r, g, b
 */
export function rgbStringToObject(rgbString: string): { r: number; g: number; b: number } {
	const [r, g, b] = rgbString.split(',').map((num) => Number.parseInt(num.trim(), 10));
	return { r, g, b };
}

/**
 * Convierte un objeto RGB a string (formato "r, g, b")
 * @param rgb Objeto con propiedades r, g, b
 * @returns String en formato "r, g, b" (ej: "59, 130, 246")
 */
export function rgbObjectToString(rgb: { r: number; g: number; b: number }): string {
	return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/**
 * Genera un color CSS válido a partir de un string RGB
 * @param rgbString String en formato "r, g, b" (ej: "59, 130, 246")
 * @returns String CSS para color (ej: "rgb(59, 130, 246)")
 */
export function rgbStringToCssColor(rgbString: string): string {
	return `rgb(${rgbString.replace(/\s/g, '')})`;
}

/**
 * Calcula si un color es claro u oscuro para determinar el color de texto adecuado
 * @param rgbString String en formato "r, g, b" (ej: "59, 130, 246")
 * @returns true si el color es claro, false si es oscuro
 */
export function isLightColor(rgbString: string): boolean {
	const { r, g, b } = rgbStringToObject(rgbString);
	// Fórmula para calcular la luminosidad percibida
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.5;
}

/**
 * Genera un color de texto adecuado (blanco o negro) según el color de fondo
 * @param rgbString String en formato "r, g, b" del color de fondo
 * @returns "255, 255, 255" para fondos oscuros o "0, 0, 0" para fondos claros
 */
export function getContrastTextColor(rgbString: string): string {
	return isLightColor(rgbString) ? '0, 0, 0' : '255, 255, 255';
}
