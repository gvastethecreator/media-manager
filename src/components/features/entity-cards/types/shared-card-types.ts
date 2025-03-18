// Tipos compartidos entre todos los componentes de tarjetas

export type CardDesignPreset =
	| 'default'
	| 'minimal'
	| 'folder'
	| 'album'
	| 'character'
	| 'place'
	| 'tag'
	| 'collection'
	| 'concept'
	| 'prompt'
	| 'worldItem'
	| 'note';
export type ShadowStyle = 'soft' | 'hard' | 'layered' | 'flat' | 'none';
export type CornerStyle = 'rounded' | 'sharp' | 'beveled';

export interface RarityConfig {
	color: string;
	borderColor: string;
	glowColor: string;
	label: string;
	rarity?: string; // Clave opcional para referencia
}

export type TextureConfig = 'gold' | 'silver' | 'bronze' | 'holographic' | 'matte' | 'glossy' | 'standard';

export interface DesignSystem {
	preset?: CardDesignPreset;
	variant?: string;
	aspectRatio?: string;
	cornerStyle?: CornerStyle;
	cornerRadius?: number;
	elevation?: number;
	shadowStyle?: ShadowStyle;
}

export interface HolographicOptions {
	patternType?: 'linear' | 'radial' | 'geometric';
	intensity?: number;
	animationSpeed?: number;
	visibleOnHover?: boolean;
}

export interface GlowOptions {
	intensity?: number;
	size?: number;
	blurAmount?: number;
	animationType?: 'static' | 'pulse' | 'flow';
	pulseSpeed?: number;
	visibleOnHover?: boolean;
}

export interface BorderOptions {
	width?: number;
	pattern?: 'solid' | 'dashed' | 'dotted' | 'double';
	animationType?: 'static' | 'pulse' | 'flow';
	animation?: {
		type?: 'static' | 'pulse' | 'flow';
		duration?: number;
		timing?: string;
		iteration?: string;
	};
	glowIntensity?: number;
}

export interface GrainOptions {
	intensity?: number;
	density?: number;
	contrast?: number;
	noise?: 'light' | 'medium' | 'heavy' | 'subtle';
	animated?: boolean;
	visibleOnHover?: boolean;
}

export interface CardStates {
	selected?: {
		style?: 'glow' | 'border' | 'overlay';
		color?: string;
	};
	disabled?: {
		opacity?: number;
		grayscale?: boolean;
	};
}

export interface PerformanceOptions {
	throttleMs?: number;
	enableImageOptimization?: boolean;
	enableVirtualization?: boolean;
	enableCaching?: boolean;
}

export interface EffectsOptions {
	enableScanlines?: boolean;
	enableLightHalo?: boolean;
	enableVignette?: boolean;
	enableColorShift?: boolean;
}

export interface ImageGridOptions {
	layout?: 'single' | 'grid' | 'masonry' | 'carousel';
	gap?: number;
	style?: 'standard' | 'polaroid' | 'framed' | 'minimal';
	aspectRatio?: string;
}

// Opciones principales de tarjeta, usadas por todos los componentes
export interface CardOptions {
	// Identificación
	entityType?: string;
	entityId?: string;
	presetId?: string;

	// Sistemas clave
	designSystem?: DesignSystem;

	// Efectos 3D
	enable3DEffect?: boolean;
	enableHolographicEffect?: boolean;
	enableScanlinesEffect?: boolean;
	enableGlowEffect?: boolean;
	enableBorderEffect?: boolean;
	enableGrainEffect?: boolean;

	// Configuración de movimiento
	hoverLiftHeight?: number;
	maxRotation?: number;

	// Colores principales
	primaryColor?: string;
	secondaryColor?: string;

	// Opciones de efectos
	holographicOptions?: HolographicOptions;
	glowOptions?: GlowOptions;
	borderOptions?: BorderOptions;
	grainOptions?: GrainOptions;

	// Estados
	states?: CardStates;

	// Rendimiento
	performance?: PerformanceOptions;

	// Visibilidad de elementos
	showTitle?: boolean;
	showType?: boolean;
	showDescription?: boolean;
	showRarity?: boolean;
	showTexture?: boolean;
	showInfo?: boolean;
	showImageCount?: boolean;

	// Configuración de imagen
	imageGrid?: ImageGridOptions;

	// Configuración de rareza
	rarityConfig?: RarityConfig;
	textureConfig?: TextureConfig;

	// Opciones adicionales específicas para diferentes tipos de tarjetas
	useImageGrid?: boolean;
	imageGridLayout?: 'single' | 'grid' | 'masonry' | 'carousel';
	imageGridGap?: number;
	imageGridStyle?: 'standard' | 'polaroid' | 'framed' | 'minimal';

	// Alineación de contenido
	contentAlignment?: 'left' | 'center' | 'right';

	// Efectos adicionales
	effects?: EffectsOptions;

	// Permitir propiedades adicionales para compatibilidad entre sistemas
	[key: string]: unknown;
}
