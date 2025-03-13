import { truncateText } from "./format.utils";

/**
 * Trunca un texto para mostrarlo en la UI con un número limitado de líneas
 * @param text Texto a truncar
 * @param maxLines Número máximo de líneas
 * @param charsPerLine Caracteres aproximados por línea
 * @returns El texto truncado
 */
export function truncateMultilineText(text: string, maxLines = 2, charsPerLine = 80): string {
	if (!text) {
		return '';
	}

	const maxLength = maxLines * charsPerLine;
	if (text.length <= maxLength) {
		return text;
	}

	return truncateText(text, maxLength);
}

/**
 * Obtiene las primeras N palabras de un texto
 * @param text Texto del que extraer palabras
 * @param wordCount Número de palabras a extraer
 * @returns Las primeras N palabras con puntos suspensivos si se truncó
 */
export function getFirstWords(text: string, wordCount: number): string {
	if (!text) {
		return '';
	}

	const words = text.split(/\s+/);
	if (words.length <= wordCount) {
		return text;
	}

	return `${words.slice(0, wordCount).join(' ')}...`;
}
