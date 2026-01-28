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
	primary: 'var(--dt-primary-500)',
	secondary: 'var(--preset-emerald)',
	tertiary: 'var(--preset-yellow)',
	quaternary: 'var(--preset-violet)',
	quinary: 'var(--dt-danger-500)',
} as const;

/**
 * Colores para áreas/rellenos (con opacidad)
 */
export const CHART_FILL_COLORS = {
	primary: 'var(--dt-primary-500)',
	secondary: 'var(--preset-emerald)',
	tertiary: 'var(--preset-yellow)',
	success: 'var(--dt-success-500)',
	warning: 'var(--dt-warning-500)',
	error: 'var(--dt-danger-500)',
} as const;

/**
 * Colores para estados de métricas
 */
export const METRIC_COLORS = {
	cpu: 'var(--preset-emerald)',
	memory: 'var(--dt-primary-500)',
	memoryFree: 'var(--preset-emerald)',
	disk: 'var(--preset-yellow)',
	network: 'var(--preset-violet)',
	io: {
		read: 'var(--preset-emerald)',
		write: 'var(--dt-primary-500)',
	},
} as const;

/**
 * Colores para distribución de tipos de archivo
 */
export const FILE_TYPE_COLORS = {
	images: 'var(--preset-emerald)',
	videos: 'var(--preset-violet)',
	audio: 'var(--preset-yellow)',
	documents: 'var(--dt-danger-500)',
	others: 'oklch(0.7 0.15 90)', // --preset-citrico
	database: 'var(--dt-primary-500)',
	cache: 'var(--preset-orange)',
} as const;

/**
 * Paleta genérica para múltiples series
 */
export const CHART_PALETTE = [
	'var(--dt-primary-500)',
	'var(--preset-emerald)',
	'var(--preset-yellow)',
	'var(--preset-violet)',
	'var(--dt-danger-500)',
	'var(--preset-sky)',
	'var(--preset-pink)',
	'var(--preset-purple)',
	'var(--preset-teal)',
	'var(--preset-indigo)',
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
	// Usar color-mix nativo de CSS para manejar opacidad con variables
	return `color-mix(in oklab, ${color}, transparent ${Math.round((1 - opacity) * 100)}%)`;
}
