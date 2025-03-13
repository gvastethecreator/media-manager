/**
 * Formatea un tamaño en bytes a una unidad más legible
 * @param bytes Tamaño en bytes
 * @param decimals Número de decimales para mostrar (por defecto 2)
 * @returns Tamaño formateado con unidad
 */
export function formatFileSize(bytes: number, decimals = 2): string {
	if (bytes === 0) {
		return '0 Bytes';
	}

	const k = 1024;
	const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${units[i]}`;
}

/**
 * Formatea un número para mostrarlo con separadores de miles
 * @param num Número a formatear
 * @param locale Configuración regional, por defecto 'es-ES'
 * @returns Número formateado con separadores de miles
 */
export function formatNumber(num: number, locale = 'es-ES'): string {
	return new Intl.NumberFormat(locale).format(num);
}

/**
 * Formatea una fecha a un formato legible
 * @param date Fecha a formatear (string, Date o timestamp)
 * @param options Opciones de formato (por defecto: fecha completa con hora)
 * @returns Fecha formateada según opciones
 */
export function formatDate(date: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
	try {
		const dateObj = new Date(date);

		if (Number.isNaN(dateObj.getTime())) {
			return 'Fecha inválida';
		}

		const defaultOptions: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		};

		return new Intl.DateTimeFormat('es-ES', options || defaultOptions).format(dateObj);
	} catch (error) {
		console.error('Error formateando fecha:', error);
		return 'Fecha inválida';
	}
}
