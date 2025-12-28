/**
 * 🎨 COLORES PARA GRÁFICOS (Recharts)
 * ===================================
 *
 * Colores consistentes para uso en gráficos Recharts.
 * Recharts requiere valores hex/rgb directos, no variables CSS.
 *
 * Estos colores corresponden a la paleta Tailwind y están
 * alineados con las variables CSS del sistema de themes.
 */

/**
 * Colores primarios para gráficos (series de datos)
 */
export const CHART_COLORS = {
	primary: 'rgb(59, 130, 246)', // blue-500 - serie principal
	secondary: 'rgb(16, 185, 129)', // emerald-500 - serie secundaria
	tertiary: 'rgb(245, 158, 11)', // amber-500 - tercera serie
	quaternary: 'rgb(139, 92, 246)', // violet-500 - cuarta serie
	quinary: 'rgb(239, 68, 68)', // red-500 - quinta serie
} as const;

/**
 * Colores para áreas/rellenos (con opacidad)
 */
export const CHART_FILL_COLORS = {
	primary: 'rgb(59, 130, 246)', // blue-500
	secondary: 'rgb(16, 185, 129)', // emerald-500
	tertiary: 'rgb(245, 158, 11)', // amber-500
	success: 'rgb(34, 197, 94)', // green-500
	warning: 'rgb(251, 191, 36)', // amber-400
	error: 'rgb(239, 68, 68)', // red-500
} as const;

/**
 * Colores para estados de métricas
 */
export const METRIC_COLORS = {
	cpu: 'rgb(16, 185, 129)', // emerald-500
	memory: 'rgb(59, 130, 246)', // blue-500
	memoryFree: 'rgb(16, 185, 129)', // emerald-500
	disk: 'rgb(245, 158, 11)', // amber-500
	network: 'rgb(139, 92, 246)', // violet-500
	io: {
		read: 'rgb(16, 185, 129)', // emerald-500
		write: 'rgb(59, 130, 246)', // blue-500
	},
} as const;

/**
 * Colores para distribución de tipos de archivo
 */
export const FILE_TYPE_COLORS = {
	images: 'rgb(16, 185, 129)', // emerald-500
	videos: 'rgb(139, 92, 246)', // violet-500
	audio: 'rgb(245, 158, 11)', // amber-500
	documents: 'rgb(239, 68, 68)', // red-500
	others: 'rgb(234, 179, 8)', // yellow-500
	database: 'rgb(59, 130, 246)', // blue-500
	cache: 'rgb(249, 115, 22)', // orange-500
} as const;

/**
 * Paleta genérica para múltiples series
 */
export const CHART_PALETTE = [
	'rgb(59, 130, 246)', // blue-500
	'rgb(16, 185, 129)', // emerald-500
	'rgb(245, 158, 11)', // amber-500
	'rgb(139, 92, 246)', // violet-500
	'rgb(239, 68, 68)', // red-500
	'rgb(14, 165, 233)', // sky-500
	'rgb(236, 72, 153)', // pink-500
	'rgb(168, 85, 247)', // purple-500
	'rgb(20, 184, 166)', // teal-500
	'rgb(99, 102, 241)', // indigo-500
] as const;

/**
 * Obtener color de la paleta por índice (cicla si excede)
 */
export function getChartColor(index: number): string {
	return CHART_PALETTE[index % CHART_PALETTE.length];
}

/**
 * Generar color con opacidad para gradientes
 */
export function withOpacity(color: string, opacity: number): string {
	// Convertir rgb(r, g, b) a rgba(r, g, b, opacity)
	if (color.startsWith('rgb(')) {
		return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
	}
	return color;
}
