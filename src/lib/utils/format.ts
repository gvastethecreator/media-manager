/**
 * @file Utilidades de formato para el proyecto
 * @module lib/utils/format
 */

/**
 * Formatea un número de bytes a una cadena legible
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Formatea una fecha a una cadena legible
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;

	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	};

	return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Formatea una fecha relativa (hace X tiempo)
 */
export function formatRelativeTime(date: Date | string): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

	if (diffInSeconds < 60) return 'hace unos segundos';
	if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
	if (diffInSeconds < 86_400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
	if (diffInSeconds < 2_592_000) return `hace ${Math.floor(diffInSeconds / 86_400)} días`;
	if (diffInSeconds < 31_536_000) return `hace ${Math.floor(diffInSeconds / 2_592_000)} meses`;

	return `hace ${Math.floor(diffInSeconds / 31_536_000)} años`;
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, total: number, decimals = 1): string {
	if (total === 0) return '0%';
	const percentage = (value / total) * 100;
	return `${percentage.toFixed(decimals)}%`;
}

/**
 * Formatea un nombre de archivo para mostrar
 */
export function formatFileName(fileName: string, maxLength = 30): string {
	if (fileName.length <= maxLength) return fileName;

	const extension = fileName.split('.').pop() || '';
	const nameWithoutExt = fileName.replace(`.${extension}`, '');
	const truncatedName = `${nameWithoutExt.substring(0, maxLength - extension.length - 4)}...`;

	return `${truncatedName}.${extension}`;
}

/**
 * Formatea una duración en milisegundos a una cadena legible
 */
export function formatDuration(milliseconds: number): string {
	const seconds = Math.floor(milliseconds / 1000);
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
