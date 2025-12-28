/**
 * 🎨 TOKENS DE COLOR SEMÁNTICOS (TypeScript)
 * ==========================================
 *
 * Este archivo proporciona constantes y utilidades para colores semánticos.
 * Usar getCssVar() para obtener colores de las variables CSS.
 *
 * REGLAS DE USO:
 * 1. NUNCA usar colores hex directamente en componentes
 * 2. Usar estos tokens para colores que necesitan ser programáticos
 * 3. Preferir clases Tailwind cuando sea posible
 */

/**
 * Obtiene el valor computado de una variable CSS
 */
export function getCssVar(name: string): string {
	if (typeof document === 'undefined') return '';
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Colores semánticos para tipos de entidad
 * Usar con getCssVar('--entity-xxx') para obtener el valor actual
 */
export const ENTITY_COLOR_VARS = {
	// Contenido
	image: '--entity-image',
	video: '--entity-video',
	audio: '--entity-audio',
	document: '--entity-document',
	file: '--entity-file',
	file3d: '--entity-file-3d',
	json: '--entity-json',

	// Organización
	folder: '--entity-folder',
	album: '--entity-album',
	collection: '--entity-collection',
	group: '--entity-group',
	favorite: '--entity-favorite',

	// Creativas
	character: '--entity-character',
	place: '--entity-place',
	worldItem: '--entity-world-item',
	concept: '--entity-concept',

	// Metadatos
	tag: '--entity-tag',
	prompt: '--entity-prompt',
	note: '--entity-note',
	profile: '--entity-profile',
	property: '--entity-property',
	wildcard: '--entity-wildcard',
} as const;

/**
 * Mapa de colores Tailwind para entidades.
 * Usar estas clases en className en lugar de estilos inline.
 */
export const ENTITY_TAILWIND_CLASSES = {
	image: {
		bg: 'bg-blue-500',
		text: 'text-blue-500',
		border: 'border-blue-500',
	},
	video: {
		bg: 'bg-red-500',
		text: 'text-red-500',
		border: 'border-red-500',
	},
	audio: {
		bg: 'bg-sky-500',
		text: 'text-sky-500',
		border: 'border-sky-500',
	},
	document: {
		bg: 'bg-slate-500',
		text: 'text-slate-500',
		border: 'border-slate-500',
	},
	file: {
		bg: 'bg-gray-500',
		text: 'text-gray-500',
		border: 'border-gray-500',
	},
	folder: {
		bg: 'bg-yellow-500',
		text: 'text-yellow-500',
		border: 'border-yellow-500',
	},
	album: {
		bg: 'bg-violet-500',
		text: 'text-violet-500',
		border: 'border-violet-500',
	},
	collection: {
		bg: 'bg-cyan-500',
		text: 'text-cyan-500',
		border: 'border-cyan-500',
	},
	group: {
		bg: 'bg-teal-500',
		text: 'text-teal-500',
		border: 'border-teal-500',
	},
	favorite: {
		bg: 'bg-amber-500',
		text: 'text-amber-500',
		border: 'border-amber-500',
	},
	character: {
		bg: 'bg-pink-500',
		text: 'text-pink-500',
		border: 'border-pink-500',
	},
	place: {
		bg: 'bg-teal-500',
		text: 'text-teal-500',
		border: 'border-teal-500',
	},
	worldItem: {
		bg: 'bg-lime-500',
		text: 'text-lime-500',
		border: 'border-lime-500',
	},
	concept: {
		bg: 'bg-amber-500',
		text: 'text-amber-500',
		border: 'border-amber-500',
	},
	tag: {
		bg: 'bg-pink-500',
		text: 'text-pink-500',
		border: 'border-pink-500',
	},
	prompt: {
		bg: 'bg-emerald-500',
		text: 'text-emerald-500',
		border: 'border-emerald-500',
	},
	note: {
		bg: 'bg-purple-500',
		text: 'text-purple-500',
		border: 'border-purple-500',
	},
	profile: {
		bg: 'bg-indigo-500',
		text: 'text-indigo-500',
		border: 'border-indigo-500',
	},
	property: {
		bg: 'bg-pink-400',
		text: 'text-pink-400',
		border: 'border-pink-400',
	},
	wildcard: {
		bg: 'bg-pink-500',
		text: 'text-pink-500',
		border: 'border-pink-500',
	},
} as const;

/**
 * Colores de estado funcionales
 */
export const STATUS_COLOR_VARS = {
	success: '--status-success',
	warning: '--status-warning',
	info: '--status-info',
} as const;

/**
 * Paleta de colores preset para el ColorPicker
 * Estos valores se usan solo para el picker, no en estilos directos
 */
export const PRESET_COLOR_VARS = [
	'--preset-blue',
	'--preset-red',
	'--preset-green',
	'--preset-yellow',
	'--preset-pink',
	'--preset-purple',
	'--preset-cyan',
	'--preset-orange',
	'--preset-teal',
	'--preset-rose',
	'--preset-indigo',
	'--preset-sky',
	'--preset-slate',
	'--preset-gray',
	'--preset-fuchsia',
	'--preset-lime',
	'--preset-cyan-dark',
	'--preset-purple-dark',
	'--preset-black',
	'--preset-white',
] as const;

/**
 * Paleta de colores hex para el ColorPicker (necesarios para valores de formulario)
 * Solo usar en contextos donde se necesite el valor hex explícito
 */
export const PRESET_COLORS_HEX = [
	'#3b82f6', // blue
	'#ef4444', // red
	'#22c55e', // green
	'#eab308', // yellow
	'#ec4899', // pink
	'#8b5cf6', // purple
	'#06b6d4', // cyan
	'#f97316', // orange
	'#14b8a6', // teal
	'#f43f5e', // rose
	'#6366f1', // indigo
	'#0ea5e9', // sky
	'#64748b', // slate
	'#6b7280', // gray
	'#d946ef', // fuchsia
	'#84cc16', // lime
	'#0891b2', // cyan-dark
	'#9333ea', // purple-dark
	'#000000', // black
	'#ffffff', // white
] as const;

/**
 * Color por defecto para nuevas entidades
 */
export const DEFAULT_ENTITY_COLOR = '#3b82f6';

/**
 * Colores de fallback comunes.
 * Úsalos solo cuando sea necesario (por ejemplo, cuando una entidad aún no tiene color).
 */
export const DEFAULT_NEUTRAL_COLOR = '#6b7280';
export const DEFAULT_DARK_COLOR = '#000000';
export const DEFAULT_LIGHT_COLOR = '#ffffff';

/**
 * Obtiene el color CSS para una entidad
 */
export function getEntityColor(entityType: keyof typeof ENTITY_COLOR_VARS): string {
	return `var(${ENTITY_COLOR_VARS[entityType]})`;
}

/**
 * Obtiene las clases Tailwind para una entidad
 */
export function getEntityClasses(
	entityType: keyof typeof ENTITY_TAILWIND_CLASSES,
	variant: 'bg' | 'text' | 'border' = 'bg',
): string {
	return ENTITY_TAILWIND_CLASSES[entityType]?.[variant] ?? 'bg-gray-500';
}

export type EntityColorKey = keyof typeof ENTITY_COLOR_VARS;
export type EntityTailwindKey = keyof typeof ENTITY_TAILWIND_CLASSES;
