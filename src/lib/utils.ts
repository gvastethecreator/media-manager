import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { deepMerge } from './utils/object-utils';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Re-exportar deepMerge desde object-utils
export { deepMerge };

/**
 * Convierte un buffer a una cadena base64 con el formato adecuado para usar como src de imagen
 * @param buffer Buffer a convertir
 * @param mimeType Tipo MIME para usar en el data URL
 * @returns Cadena base64 con el formato data:image/[tipo];base64,[datos]
 */
export function bufferToBase64Image(buffer: Buffer | null | undefined, mimeType = 'image/webp'): string | null {
	if (!buffer) {
		return null;
	}

	try {
		// Asegurarnos de que estamos tratando con un Buffer
		if (Buffer.isBuffer(buffer)) {
			return `data:${mimeType};base64,${buffer.toString('base64')}`;
		} else if (typeof buffer === 'object') {
			// Intentar convertir un objeto similar a buffer
			return `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;
		}
		return null;
	} catch (error) {
		console.error('Error al convertir buffer a base64:', error);
		return null;
	}
}

export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		...options
	};

	return new Date(date).toLocaleDateString('es-ES', defaultOptions);
}
