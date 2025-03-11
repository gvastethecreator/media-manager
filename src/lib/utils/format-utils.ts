/**
 * Utilidades para formateo de datos en la interfaz de usuario
 */

/**
 * Formatea un tamaño de archivo en bytes a una representación legible
 * @param bytes - Tamaño en bytes
 * @param decimals - Número de decimales a mostrar
 * @returns Tamaño formateado como string (ej: "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
	if (bytes === 0) {
		return '0 Bytes';
	}

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Formatea un número para mostrarlo como contador con separadores de miles
 * @param num - Número a formatear
 * @returns Número formateado como string (ej: "1,234,567")
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Trunca un texto a un número máximo de caracteres, añadiendo puntos suspensivos
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima permitida
 * @returns Texto truncado si excede la longitud máxima
 */
export function truncateText(text: string, maxLength: number): string {
	if (!text || text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength)}...`;
}

/**
 * Formatea una fecha a una representación legible
 * @param date - Fecha a formatear
 * @returns Fecha formateada como string (ej: "01/01/2023")
 */
export function formatDate(date: Date | string): string {
	if (!date) {
		return '';
	}
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return dateObj.toLocaleDateString('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

/**
 * Formatea un tiempo en segundos a formato mm:ss
 * @param seconds - Tiempo en segundos
 * @returns Tiempo formateado (ej: "05:30")
 */
export function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
	return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}
