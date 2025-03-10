/**
 * Formatea un tamaño en bytes a una representación legible por humanos.
 * @param bytes - El tamaño en bytes a formatear
 * @param decimals - El número de decimales a mostrar
 * @returns - El tamaño formateado con la unidad apropiada
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
 * Formatea un número con separadores de miles.
 * @param num - El número a formatear
 * @returns - El número formateado con separadores de miles
 */
export function formatNumber(num: number): string {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formatea una fecha a una representación legible.
 * @param date - La fecha a formatear
 * @param options - Opciones de formato
 * @returns - La fecha formateada
 */
export function formatDate(date: Date | string | number, options: Intl.DateTimeFormatOptions = {}): string {
	const dateObj = date instanceof Date ? date : new Date(date);

	const defaultOptions: Intl.DateTimeFormatOptions = {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	};

	return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Formatea una duración en milisegundos a un formato legible.
 * @param ms - La duración en milisegundos
 * @returns - La duración formateada
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
