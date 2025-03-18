/**
 * Utilidades para formatear diferentes tipos de datos
 */

/**
 * Formatea un tamaño en bytes a una representación legible
 * @param bytes Tamaño en bytes
 * @param decimals Número de decimales a mostrar (por defecto 2)
 * @returns Cadena formateada con unidades apropiadas
 */
export function formatFileSize(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formatea una fecha a un formato legible en español
 * @param date Fecha a formatear
 * @returns Cadena de fecha formateada
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

/**
 * Formatea un número añadiendo separadores de miles
 * @param number Número a formatear
 * @returns Cadena formateada con separadores de miles
 */
export function formatNumber(number: number): string {
	return new Intl.NumberFormat('es-ES').format(number);
}

/**
 * Formatea una duración en segundos a formato hh:mm:ss
 * @param seconds Duración en segundos
 * @returns Cadena en formato hh:mm:ss
 */
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	const parts = [];
	if (hours > 0) {
		parts.push(`${hours}h`);
	}
	if (minutes > 0 || hours > 0) {
		parts.push(`${minutes}m`);
	}
	parts.push(`${secs}s`);

	return parts.join(' ');
}
