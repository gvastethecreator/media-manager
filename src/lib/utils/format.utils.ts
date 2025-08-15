/**
 * Utilidades de formateo para la aplicación
 */

// Regex de extensión de archivo (declarada a nivel superior para rendimiento)
const FILE_EXTENSION_REGEX = /\.[^/.]+$/;

/**
 * Formatea un tamaño en bytes a una representación legible
 * @param bytes - Tamaño en bytes
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Tamaño formateado (ej: "1.5 MB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) {
		return '0 Bytes';
	}

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Alias de formatBytes para mantener compatibilidad con código existente
 * @param bytes - Tamaño en bytes
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Tamaño formateado (ej: "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
	return formatBytes(bytes, decimals);
}

/**
 * Formatea un número con separadores de miles
 * @param num - Número a formatear
 * @param locale - Configuración regional (por defecto 'es-ES')
 * @returns Número formateado (ej: "1.234.567")
 */
export function formatNumber(num: number, locale = 'es-ES'): string {
	return new Intl.NumberFormat(locale).format(num);
}

/**
 * Formatea una fecha a una representación legible
 * @param date - Fecha a formatear
 * @param options - Opciones de formato
 * @returns Fecha formateada
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
	try {
		const dateObj = new Date(date);
		if (Number.isNaN(dateObj.getTime())) {
			return 'Fecha inválida';
		}

		const defaultOptions: Intl.DateTimeFormatOptions = {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		};

		return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options }).format(dateObj);
	} catch (error) {
		console.error('Error formateando fecha:', error);
		return 'Fecha inválida';
	}
}

/**
 * Formatea una duración en milisegundos
 * @param ms - Duración en milisegundos
 * @returns Duración formateada (ej: "2h 30m" o "45s")
 */
export function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${ms}ms`;
	}

	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	}

	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	}

	return `${seconds}s`;
}

/**
 * Formatea una duración expresada en segundos.
 * @param seconds - Duración en segundos
 * @returns Duración formateada (ej: "2h 30m" o "45s")
 */
export function formatDurationSeconds(seconds: number): string {
	return formatDuration(Math.max(0, Math.floor(seconds * 1000)));
}

/**
 * Extrae el nombre de un archivo sin su extensión
 * @param name - Nombre del archivo con extensión
 * @returns Nombre sin extensión
 */
export function formatFileName(name: string): string {
	return name.replace(FILE_EXTENSION_REGEX, '');
}

/**
 * Trunca un texto a una longitud máxima
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado con puntos suspensivos si excede la longitud
 */
export function truncateText(text: string, maxLength: number): string {
	if (!text || text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitaliza la primera letra de un texto
 * @param text - Texto a capitalizar
 * @returns Texto con la primera letra en mayúscula
 */
export function capitalizeFirstLetter(text: string): string {
	if (!text) {
		return '';
	}
	return text.charAt(0).toUpperCase() + text.slice(1);
}
