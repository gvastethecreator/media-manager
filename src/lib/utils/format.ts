/**
 * Formatea un tamaño en bytes a una representación legible por humanos
 * @param bytes Tamaño en bytes
 * @param decimals Número de decimales a mostrar (por defecto 2)
 * @returns Cadena formateada con unidades (B, KB, MB, GB, TB)
 */
export function formatFileSize(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Formatea una fecha a una representación legible por humanos
 * @param date Fecha a formatear
 * @param options Opciones de formato
 * @returns Cadena formateada con la fecha
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;

	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	};

	return dateObj.toLocaleDateString(undefined, options || defaultOptions);
}

/**
 * Trunca un texto a una longitud máxima
 * @param text Texto a truncar
 * @param maxLength Longitud máxima (por defecto 100)
 * @param suffix Sufijo a añadir si se trunca (por defecto "...")
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength = 100, suffix = '...'): string {
	if (!text) return '';
	if (text.length <= maxLength) return text;

	return text.substring(0, maxLength) + suffix;
}
