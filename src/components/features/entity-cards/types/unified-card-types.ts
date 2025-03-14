/**
 * Tipos unificados para el sistema de tarjetas de entidades
 * Estos tipos son la referencia principal para todas las tarjetas
 */

// Presets de diseño de tarjetas
export type CardPreset =
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

// Añadimos alias para compatibilidad
export type CardDesignPreset = CardPreset;

// Variantes de tarjetas
export type CardVariant = 'default' | 'alternative' | 'minimal' | 'expanded' | 'compact';

// Estilos de esquinas
export type CornerStyle = 'rounded' | 'sharp' | 'beveled';

// Estilos de sombras - compatible con shared-card-types.ts
export type ShadowStyle = 'soft' | 'hard' | 'layered' | 'flat';

// Sistema de diseño de tarjetas
export interface DesignSystem {
	preset?: CardPreset;
	variant?: string;
	aspectRatio?: string;
	cornerStyle?: CornerStyle;
	cornerRadius?: number;
	elevation?: number;
	shadowStyle?: ShadowStyle;
}

// Configuración de animaciones
export interface AnimationSystem {
	type?: 'hover' | 'continuous' | 'none';
	duration?: number;
	style?: 'bounce' | 'float' | 'pulse' | 'glow' | 'none';
	intensity?: number;
}

// Opciones de holográfico
export interface HolographicOptions {
	enabled?: boolean;
	patternType?: 'rainbow' | 'geometric' | 'radial' | 'linear';
	intensity?: number;
	animationSpeed?: number;
	visibleOnHover?: boolean;
	primaryColor?: string;
	secondaryColor?: string;
	layerIndex?: number;
}

// Opciones de brillo
export interface GlowOptions {
	enabled?: boolean;
	color?: string;
	intensity?: number;
	size?: number;
	blurAmount?: number;
	animationType?: 'static' | 'pulse' | 'breathe' | 'flicker';
	pulseSpeed?: number;
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Opciones de borde
export interface BorderOptions {
	enabled?: boolean;
	width?: number;
	color?: string;
	pattern?: 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient';
	animationType?: 'static' | 'pulse' | 'flow' | 'rainbow';
	animation?: {
		type?: 'none' | 'pulse' | 'flow' | 'rainbow';
		duration?: number;
		timing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
		iteration?: 'once' | 'infinite';
	};
	glowIntensity?: number;
	glowColor?: string;
	glowOnHover?: boolean;
	layerIndex?: number;
	gradientColors?: string[];
	gradientAngle?: number;
	opacity?: number;
	blur?: number;
	spread?: number;
	animationSpeed?: number;
	animationDuration?: number;
}

// Opciones de grano
export interface GrainOptions {
	enabled?: boolean;
	intensity?: number;
	density?: number;
	contrast?: number;
	noise?: 'subtle' | 'medium' | 'heavy' | 'digital' | 'film' | 'light';
	animated?: boolean;
	visibleOnHover?: boolean;
	animationSpeed?: number;
	layerIndex?: number;
}

// Opciones de líneas de escaneo
export interface ScanlinesOptions {
	enabled?: boolean;
	density?: number;
	opacity?: number;
	speed?: number;
	color?: string;
	animated?: boolean;
	visibleOnHover?: boolean;
	spacing?: number;
	direction?: 'horizontal' | 'vertical' | 'diagonal';
	animationSpeed?: number;
	layerIndex?: number;
}

// Opciones para la cara posterior
export interface BacksideOptions {
	enabled?: boolean;
	layoutType?: 'mirror' | 'stats' | 'info' | 'custom';
	colorMode?: 'same' | 'inverse' | 'custom';
	customColor?: string;
	opacity?: number;
	blurBackground?: boolean;
	blurAmount?: number;
	animation?: 'fade' | 'slide' | 'flip';
	animationDuration?: number;
	showBackContent?: boolean;
}

// Configuración de capas
export interface LayersConfig {
	background?: {
		enabled: boolean;
		type?: 'color' | 'gradient' | 'image' | 'pattern';
		color?: string;
		gradientType?: 'linear' | 'radial';
		gradientColors?: string[];
		patternType?: string;
		image?: string;
	};
	frame?: {
		enabled: boolean;
		style?: 'classic' | 'modern' | 'vintage' | 'minimal';
		color?: string;
	};
	content?: {
		enabled: boolean;
		layout?: 'default' | 'centered' | 'split';
	};
	effects?: string[];
	order?: string[];
	blendMode?: string;
	spacing?: number;
	explodeView?: boolean;
	explodeDistance?: number;
}

// Paleta de colores
export interface ColorPalette {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	text: string;
	border: string;
}

// Configuración de rendimiento
export interface PerformanceOptions {
	// Optimizaciones generales
	lazyLoad?: boolean;
	virtualScroll?: boolean;
	imageOptimization?: boolean;
	animationOptimization?: boolean;
	renderQuality?: 'low' | 'medium' | 'high';
}

// Estados para las tarjetas
export interface CardStates {
	enableHover?: boolean;
	enableFocus?: boolean;
	enableActive?: boolean;
	enableSelected?: boolean;
	stateEffect?: string;
	stateIntensity?: number;
	stateDuration?: number;
}

// Opciones para interactividad
export interface CardInteractivity {
	enableHoverEffects?: boolean;
	enableClickEffects?: boolean;
	hover?: {
		scale?: number;
		rotate?: boolean;
		lift?: boolean;
		glow?: boolean;
	};
}

// Configuración completa de tarjeta
export interface CardOptions {
	// Identificadores
	entityType?: string;
	entityId?: string;
	presetId?: string;

	// Sistemas principales
	designSystem?: DesignSystem;
	animation?: AnimationSystem;
	colors?: ColorPalette | string;
	layers?: LayersConfig;
	states?: CardStates;
	interactivity?: CardInteractivity;

	// Efectos visuales
	enable3DEffect?: boolean;
	enableHolographicEffect?: boolean;
	enableScanlinesEffect?: boolean;
	enableGlowEffect?: boolean;
	enableBorderEffect?: boolean;
	enableGrainEffect?: boolean;
	enableScanlines?: boolean;
	enableAnimatedBorder?: boolean;
	enableLightHalo?: boolean;

	// Opciones detalladas de efectos
	holographicOptions?: HolographicOptions;
	glowOptions?: GlowOptions;
	borderOptions?: BorderOptions;
	grainOptions?: GrainOptions;
	scanlinesOptions?: ScanlinesOptions;
	backside?: BacksideOptions;

	// Rendimiento
	performanceMode?: 'quality' | 'balanced' | 'performance';
	disableAnimationsOnMobile?: boolean;
	performance?: PerformanceOptions;

	// Metadatos
	version?: string;
	lastModified?: string;

	// Propiedades adicionales del base-card-types
	raritySystem?: {
		enabled?: boolean;
		defaultRarity?: string;
		rarities?: Record<string, any>;
	};

	// Propiedades para compatibilidad con código existente
	[key: string]: any;
}
