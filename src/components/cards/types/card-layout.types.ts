/**
 * @file Tipos para el sistema de s de cards
 * @module components/cards/types/card--types
 * @description Define los diferentes tipos de  disponibles para las cards
 */

/** Tipos de  disponibles para las cards */
export type CardLayout =
	| 'minimal' // Solo icono/thumbnail + nombre
	| 'compact' // Información básica compacta
	| 'complete' // Información completa (default)
	| 'horizontal' // Layout horizontal (para listas)
	| 'vertical' // Layout vertical (para grids)
	| 'list' // Layout específico para vista de lista
	| 'grid' // Layout específico para vista de grid
	| 'masonry'; // Layout para vista masonry

/** Tamaños de card disponibles */
export type CardSize =
	| 'xs' // Extra small (64px)
	| 'sm' // Small (120px)
	| 'md' // Medium (200px) - default
	| 'lg' // Large (280px)
	| 'xl' // Extra large (400px)
	| 'auto'; // Tamaño automático

/** Variantes visuales de las cards */
export type CardVariant =
	| 'default' // Estilo estándar
	| 'minimal' // Estilo minimalista
	| 'elevated' // Con sombra elevada
	| 'outlined' // Solo borde
	| 'tcg' // Estilo Trading Card Game
	| 'polaroid' // Estilo polaroid (para imágenes)
	| 'glass'; // Efecto glassmorphism

/** Configuración de layout para una card */
export interface CardLayoutConfig {
	/** Ratio de aspecto */
	aspectRatio?: string | number;
	/** Densidad de información */
	density?: 'low' | 'medium' | 'high';
	/** Alto específico (overrides size) */
	height?: number;
	/** Tipo de layout */
	layout: CardLayout;
	/** Orientación para s horizontales */
	orientation?: 'left' | 'right' | 'center';
	/** Mostrar acciones */
	showActions?: boolean;
	/** Mostrar información adicional */
	showDetails?: boolean;
	/** Mostrar metadatos */
	showMetadata?: boolean;
	/** Mostrar estadísticas */
	showStats?: boolean;
	/** Mostrar tags/etiquetas */
	showTags?: boolean;
	/** Tamaño de la card */
	size: CardSize;
	/** Variante visual */
	variant: CardVariant;
	/** Ancho específico (overrides size) */
	width?: number;
}

/** Props base para todas las cards con  */
export interface BaseCardProps {
	/** Configuración de  */
	Config?: Partial<CardLayoutConfig>;
	/** Clase CSS adicional */
	className?: string;
	/** Props legacy para compatibilidad */
	compact?: boolean;
	/** Si la card está activa */
	isActive?: boolean;
	/** Si la card está en estado de carga */
	isLoading?: boolean;
	/** Si la card está seleccionada */
	isSelected?: boolean;
	/** Layout rápido (shortcut) */
	layout?: CardLayout;
	/** Callback de click */
	onClick?: (e: React.MouseEvent) => void;
	/** Callback de menú contextual */
	onContextMenu?: (e: React.MouseEvent) => void;
	/** Callback de doble click */
	onDoubleClick?: () => void;
	/** Tamaño rápido (shortcut) */
	size?: CardSize;
	tcgMode?: boolean;
	/** Calidad de thumbnail preferida */
	thumbnailQuality?: 'low' | 'medium' | 'high';
	/** Variante rápida (shortcut) */
	variant?: CardVariant;
}

/** Configuraciones predefinidas para diferentes contextos */
export const LAYOUT_PRESETS: Record<string, CardLayoutConfig> = {
	// Presets para file browser
	'file-browser-grid': {
		layout: 'vertical',
		size: 'md',
		variant: 'default',
		showDetails: true,
		showTags: false,
		showStats: true,
		density: 'medium',
	},
	'file-browser-list': {
		layout: 'horizontal',
		size: 'sm',
		variant: 'minimal',
		showDetails: true,
		showTags: false,
		showStats: false,
		density: 'low',
		orientation: 'left',
	},
	'file-browser-cards': {
		layout: 'complete',
		size: 'lg',
		variant: 'elevated',
		showDetails: true,
		showTags: true,
		showStats: true,
		density: 'high',
	},
	'file-browser-minimal': {
		layout: 'minimal',
		size: 'xs',
		variant: 'minimal',
		showDetails: false,
		showTags: false,
		showStats: false,
		density: 'low',
	},

	// Presets para diferentes vistas
	'folder-content': {
		layout: 'vertical',
		size: 'md',
		variant: 'default',
		showDetails: true,
		showStats: true,
		density: 'medium',
	},
	'search-results': {
		layout: 'compact',
		size: 'sm',
		variant: 'outlined',
		showDetails: true,
		showTags: true,
		density: 'medium',
	},
	dashboard: {
		layout: 'complete',
		size: 'lg',
		variant: 'elevated',
		showDetails: true,
		showTags: true,
		showStats: true,
		showActions: true,
		density: 'high',
	},

	// Presets especiales
	'tcg-mode': {
		layout: 'complete',
		size: 'lg',
		variant: 'tcg',
		showDetails: true,
		showTags: true,
		showStats: true,
		density: 'high',
	},
	gallery: {
		layout: 'vertical',
		size: 'md',
		variant: 'polaroid',
		aspectRatio: '1',
		showDetails: false,
		showTags: false,
		density: 'low',
	},
	masonry: {
		layout: 'masonry',
		size: 'auto',
		variant: 'default',
		showDetails: true,
		showTags: true,
		density: 'medium',
	},
};

/** Función para resolver la configuración final de  */
export function resolveLayoutConfig(props: Partial<BaseCardProps>, preset?: string): CardLayoutConfig {
	// Configuración base
	const baseConfig: CardLayoutConfig = {
		layout: 'complete',
		size: 'md',
		variant: 'default',
		showDetails: true,
		showTags: true,
		showStats: true,
		showMetadata: false,
		showActions: false,
		density: 'medium',
	};

	// Aplicar preset si se especifica
	const presetConfig = preset ? LAYOUT_PRESETS[preset] : {};

	// Aplicar props directas (shortcuts)
	const directConfig: Partial<CardLayoutConfig> = {};
	if (props.layout) {
		directConfig.layout = props.layout;
	}
	if (props.size) {
		directConfig.size = props.size;
	}
	if (props.variant) {
		directConfig.variant = props.variant;
	}

	// Compatibilidad con props legacy
	const legacyConfig: Partial<CardLayoutConfig> = {};
	if (props.compact) {
		legacyConfig.layout = 'compact';
		legacyConfig.size = 'sm';
		legacyConfig.showDetails = false;
	}
	if (props.tcgMode) {
		legacyConfig.variant = 'tcg';
		legacyConfig.showDetails = true;
		legacyConfig.showTags = true;
	}

	// Combinar todas las configuraciones
	return {
		...baseConfig,
		...presetConfig,
		...props.Config,
		...directConfig,
		...legacyConfig,
	};
}
