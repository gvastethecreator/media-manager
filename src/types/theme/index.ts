/**
 * @file Theme Types
 * @module types/theme
 * @description Tipos para el sistema de temas personalizados
 */

/**
 * Variables CSS base de un tema
 * Siguiendo el sistema OKLCH del proyecto
 */
export interface ThemeColors {
	// Accent
	accent: string;
	accentForeground: string;
	// Colores base
	background: string;

	// Bordes e inputs
	border: string;

	// Tarjetas y popovers
	card: string;
	cardForeground: string;

	// Charts (opcional)
	chart1?: string;
	chart2?: string;
	chart3?: string;
	chart4?: string;
	chart5?: string;

	// Destructive
	destructive: string;
	destructiveForeground: string;
	foreground: string;
	input: string;

	// Muted (elementos deshabilitados/suaves)
	muted: string;
	mutedForeground: string;
	popover: string;
	popoverForeground: string;

	// Colores primarios
	primary: string;
	primaryForeground: string;
	ring: string;

	// Colores secundarios
	secondary: string;
	secondaryForeground: string;
	sidebarAccent: string;
	sidebarAccentForeground: string;

	// Sidebar
	sidebarBackground: string;
	sidebarBorder: string;
	sidebarForeground: string;
	sidebarPrimary: string;
	sidebarPrimaryForeground: string;
	sidebarRing: string;
}

/**
 * Metadatos de un tema
 */
export interface ThemeMetadata {
	/** Autor del tema */
	author?: string;
	/** Si el tema está basado en uno existente */
	baseTheme?: string;
	/** Fecha de creación */
	createdAt: string;
	/** Descripción del tema */
	description?: string;
	/** ID único del tema */
	id: string;
	/** Si es un tema oscuro o claro */
	isDark: boolean;
	/** Nombre mostrado */
	name: string;
	/** Tags para categorización */
	tags?: string[];
	/** Fecha de última modificación */
	updatedAt: string;
}

/**
 * Tema personalizado completo
 */
export interface CustomTheme extends ThemeMetadata {
	colors: ThemeColors;
}

/**
 * Tema predefinido del sistema
 */
export interface BuiltInTheme {
	description: string;
	icon: 'sun' | 'moon' | 'monitor';
	id: string;
	isDark: boolean;
	name: string;
	/** Color representativo para preview */
	previewColor: string;
}

/**
 * Lista de temas built-in disponibles
 */
export const BUILT_IN_THEMES: BuiltInTheme[] = [
	{
		id: 'light',
		name: 'Claro',
		description: 'Tema claro con tonos grises suaves',
		isDark: false,
		icon: 'sun',
		previewColor: 'oklch(0.55 0.13 240)',
	},
	{
		id: 'dark',
		name: 'Oscuro',
		description: 'Tema oscuro para reducir fatiga visual',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.55 0.18 240)',
	},
	{
		id: 'cafe',
		name: 'Café',
		description: 'Tonos marrones cálidos y acogedores',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.5 0.07 50)',
	},
	{
		id: 'violeta',
		name: 'Violeta',
		description: 'Púrpuras oscuros elegantes',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.5 0.15 280)',
	},
	{
		id: 'madera',
		name: 'Madera',
		description: 'Tonos madera neutros y naturales',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.5 0.08 30)',
	},
	{
		id: 'nocturno',
		name: 'Nocturno',
		description: 'Azulado para reducir fatiga visual nocturna',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.55 0.18 220)',
	},
	{
		id: 'verde',
		name: 'Verde',
		description: 'Esmeralda oscuro y natural',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.45 0.15 140)',
	},
	{
		id: 'atardecer',
		name: 'Atardecer',
		description: 'Naranjas y rojos cálidos',
		isDark: true,
		icon: 'sun',
		previewColor: 'oklch(0.5 0.12 30)',
	},
	{
		id: 'corporativo',
		name: 'Corporativo',
		description: 'Azul profesional y serio',
		isDark: true,
		icon: 'monitor',
		previewColor: 'oklch(0.4 0.1 240)',
	},
	{
		id: 'carbon',
		name: 'Carbón',
		description: 'Negro carbón puro y minimalista',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.75 0.01 0)',
	},
	{
		id: 'teal',
		name: 'Teal',
		description: 'Verde azulado refrescante',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.45 0.12 180)',
	},
	{
		id: 'citrico',
		name: 'Cítrico',
		description: 'Amarillos vibrantes y energéticos',
		isDark: true,
		icon: 'sun',
		previewColor: 'oklch(0.5 0.15 90)',
	},
	{
		id: 'aurora',
		name: 'Aurora',
		description: 'Inspirado en auroras boreales',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.65 0.2 190)',
	},
	{
		id: 'neon',
		name: 'Neón',
		description: 'Estilo cyberpunk con colores vibrantes',
		isDark: true,
		icon: 'moon',
		previewColor: 'oklch(0.7 0.25 350)',
	},
];

/**
 * Estructura del estado de temas en el store
 */
export interface ThemeStoreState {
	/** Tema activo (puede ser built-in o custom) */
	activeThemeId: string;
	/** Temas personalizados del usuario */
	customThemes: CustomTheme[];
	/** Si el tema activo es personalizado */
	isCustomTheme: boolean;
}

/**
 * Acciones del store de temas
 */
export interface ThemeStoreActions {
	/** Añadir nuevo tema personalizado */
	addCustomTheme: (theme: CustomTheme) => void;
	/** Aplicar tema al DOM */
	applyTheme: (themeId: string) => void;
	/** Eliminar tema personalizado */
	deleteCustomTheme: (id: string) => void;
	/** Duplicar tema (built-in o custom) para editar */
	duplicateTheme: (sourceId: string, newName: string) => CustomTheme;
	/** Exportar tema como JSON */
	exportTheme: (id: string) => string;
	/** Importar tema desde JSON */
	importTheme: (json: string) => CustomTheme | null;
	/** Actualizar tema existente */
	updateCustomTheme: (id: string, updates: Partial<CustomTheme>) => void;
}

/**
 * Colores por defecto para crear nuevo tema
 */
export const DEFAULT_THEME_COLORS: ThemeColors = {
	background: 'oklch(0.15 0.02 240)',
	foreground: 'oklch(0.95 0.01 0)',
	card: 'oklch(0.2 0.02 240)',
	cardForeground: 'oklch(0.95 0.01 0)',
	popover: 'oklch(0.2 0.02 240)',
	popoverForeground: 'oklch(0.95 0.01 0)',
	primary: 'oklch(0.55 0.18 240)',
	primaryForeground: 'oklch(0.98 0.01 0)',
	secondary: 'oklch(0.25 0.02 240)',
	secondaryForeground: 'oklch(0.95 0.01 0)',
	muted: 'oklch(0.25 0.02 240)',
	mutedForeground: 'oklch(0.65 0.01 0)',
	accent: 'oklch(0.25 0.02 240)',
	accentForeground: 'oklch(0.95 0.01 0)',
	destructive: 'oklch(0.6 0.2 25)',
	destructiveForeground: 'oklch(0.98 0.01 0)',
	border: 'oklch(0.3 0.02 240)',
	input: 'oklch(0.3 0.02 240)',
	ring: 'oklch(0.55 0.18 240)',
	sidebarBackground: 'oklch(0.12 0.02 240)',
	sidebarForeground: 'oklch(0.95 0.01 0)',
	sidebarPrimary: 'oklch(0.55 0.18 240)',
	sidebarPrimaryForeground: 'oklch(0.98 0.01 0)',
	sidebarAccent: 'oklch(0.2 0.02 240)',
	sidebarAccentForeground: 'oklch(0.95 0.01 0)',
	sidebarBorder: 'oklch(0.25 0.02 240)',
	sidebarRing: 'oklch(0.55 0.18 240)',
	chart1: 'oklch(0.55 0.18 240)',
	chart2: 'oklch(0.6 0.15 145)',
	chart3: 'oklch(0.65 0.15 85)',
	chart4: 'oklch(0.6 0.2 25)',
	chart5: 'oklch(0.55 0.2 280)',
};

/**
 * Mapeo de propiedad a variable CSS
 */
export const THEME_CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
	background: '--background',
	foreground: '--foreground',
	card: '--card',
	cardForeground: '--card-foreground',
	popover: '--popover',
	popoverForeground: '--popover-foreground',
	primary: '--primary',
	primaryForeground: '--primary-foreground',
	secondary: '--secondary',
	secondaryForeground: '--secondary-foreground',
	muted: '--muted',
	mutedForeground: '--muted-foreground',
	accent: '--accent',
	accentForeground: '--accent-foreground',
	destructive: '--destructive',
	destructiveForeground: '--destructive-foreground',
	border: '--border',
	input: '--input',
	ring: '--ring',
	sidebarBackground: '--sidebar-background',
	sidebarForeground: '--sidebar-foreground',
	sidebarPrimary: '--sidebar-primary',
	sidebarPrimaryForeground: '--sidebar-primary-foreground',
	sidebarAccent: '--sidebar-accent',
	sidebarAccentForeground: '--sidebar-accent-foreground',
	sidebarBorder: '--sidebar-border',
	sidebarRing: '--sidebar-ring',
	chart1: '--chart-1',
	chart2: '--chart-2',
	chart3: '--chart-3',
	chart4: '--chart-4',
	chart5: '--chart-5',
};

/**
 * Categorías de colores para el editor
 */
export interface ThemeColorCategory {
	colors: (keyof ThemeColors)[];
	description: string;
	id: string;
	name: string;
}

export const THEME_COLOR_CATEGORIES: ThemeColorCategory[] = [
	{
		id: 'base',
		name: 'Colores Base',
		description: 'Fondos y textos principales',
		colors: ['background', 'foreground', 'card', 'cardForeground', 'popover', 'popoverForeground'],
	},
	{
		id: 'brand',
		name: 'Marca',
		description: 'Colores primarios y de acento',
		colors: ['primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground'],
	},
	{
		id: 'states',
		name: 'Estados',
		description: 'Muted y destructivo',
		colors: ['muted', 'mutedForeground', 'destructive', 'destructiveForeground'],
	},
	{
		id: 'ui',
		name: 'UI Elements',
		description: 'Bordes, inputs y focus',
		colors: ['border', 'input', 'ring'],
	},
	{
		id: 'sidebar',
		name: 'Sidebar',
		description: 'Panel lateral',
		colors: [
			'sidebarBackground',
			'sidebarForeground',
			'sidebarPrimary',
			'sidebarPrimaryForeground',
			'sidebarAccent',
			'sidebarAccentForeground',
			'sidebarBorder',
			'sidebarRing',
		],
	},
	{
		id: 'charts',
		name: 'Gráficos',
		description: 'Colores para visualizaciones',
		colors: ['chart1', 'chart2', 'chart3', 'chart4', 'chart5'],
	},
];
