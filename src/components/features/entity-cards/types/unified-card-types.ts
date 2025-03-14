// Tipos base para efectos
export interface HolographicEffectOptions {
	patternType?: string;
	intensity?: number;
	animationSpeed?: number;
	visibleOnHover?: boolean;
	primaryColor?: string;
	secondaryColor?: string;
	layerIndex?: number;
}

export interface ScanlinesOptions {
	opacity?: number;
	spacing?: number;
	color?: string;
	animate?: boolean;
	direction?: 'horizontal' | 'vertical';
	visibleOnHover?: boolean;
	layerIndex?: number;
}

export interface GlowEffectOptions {
	enabled?: boolean;
	color?: string;
	intensity?: number;
	radius?: number;
	spread?: number;
	animation?: {
		type?: string;
		duration?: number;
		timing?: string;
		iteration?: number | 'infinite';
	};
}

export interface BorderOptions {
	color?: string;
	width?: number;
	pattern?: string;
	animationType?: string;
	glowColor?: string;
	glowIntensity?: number;
	glowOnHover?: boolean;
	layerIndex?: number;
	gradientColors?: string[];
	gradientAngle?: number;
	animation?: {
		type: string;
		duration: number;
		timing: string;
		iteration: string;
	};
}

export interface GrainEffectOptions {
	intensity?: number;
	density?: number;
	contrast?: number;
	noise?: string;
	animated?: boolean;
	animationSpeed?: number;
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Sistema de diseño
export interface DesignSystem {
	preset: CardPreset;
	variant: CardVariant;
	aspectRatio: string;
	cornerStyle: CornerStyle;
	cornerRadius: string;
	borderStyle: BorderStyle;
	borderWidth: string;
	elevation: string;
	shadowStyle: ShadowStyle;
	textStyle: TextStyle;
	contentPadding: string;
}

// Sistema de capas
export interface LayerSystem {
	order?: string[];
	blendMode?: string;
	spacing?: number;
	explodeView?: boolean;
	explodeDistance?: number;
}

// Sistema de animación
export interface AnimationSystem {
	type?: string;
	duration?: number;
	timing?: string;
	iteration?: number | 'infinite';
}

// Sistema de explosión
export interface ExplodeSystem {
	enabled?: boolean;
	distance?: number;
	duration?: number;
	timing?: string;
}

// Configuración de grid de imágenes
export interface ImageGrid {
	layout?: 'single' | 'grid' | 'masonry';
	gap?: number;
	style?: 'standard' | 'compact' | 'spacious';
	aspectRatio?: string;
}

// Estados de la tarjeta
export interface CardStates {
	hover?: {
		scale?: number;
		rotate?: boolean;
		lift?: boolean;
		duration?: number;
		easing?: string;
	};
	active?: {
		scale?: number;
		brightness?: number;
	};
	disabled?: {
		opacity?: number;
		grayscale?: boolean;
	};
	selected?: {
		style?: string;
		color?: string;
	};
}

// Interactividad de la tarjeta
export interface CardInteractivity {
	enableHover?: boolean;
	enableFocus?: boolean;
	enableActive?: boolean;
	enableSelected?: boolean;
	stateEffect?: string;
	stateIntensity?: number;
	stateDuration?: number;
}

// Opciones de rendimiento
export interface PerformanceOptions {
	enableHardwareAcceleration?: boolean;
	useRAF?: boolean;
	batchUpdates?: boolean;
	throttleMs?: number;
	enableImageOptimization?: boolean;
	enableVirtualization?: boolean;
	enableCaching?: boolean;
}

// Opciones de backside
export interface BacksideOptions {
	enabled: boolean;
	layoutType?: string;
	colorMode?: string;
	customColor?: string;
	opacity?: number;
	blurBackground?: boolean;
	blurAmount?: number;
	showAttributes?: boolean;
	showDescription?: boolean;
	showStats?: boolean;
	showMetadata?: boolean;
	showRelations?: boolean;
	maxDescriptionLength?: number;
	flipAnimation?: string;
	flipDuration?: number;
	enableAutoFlip?: boolean;
	autoFlipDelay?: number;
	flipTrigger?: string;
	headingStyle?: string;
	infoStyle?: string;
	separatorStyle?: string;
}

// Tipos de diseño
export type CardPreset = 'default' | 'minimal' | 'detailed' | 'custom';
export type CardVariant = 'standard' | 'compact' | 'expanded';
export type CornerStyle = 'rounded' | 'sharp';
export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export type ShadowStyle = 'soft' | 'sharp';
export type TextStyle = 'default' | 'bold' | 'italic';

// Tipos de efectos visuales
export type VisualEffect = {
	enableHolographic: boolean;
	enableGlow: boolean;
	enableGrain: boolean;
	holographicIntensity: number;
	glowIntensity: number;
	grainIntensity: number;
	holographicColor: string;
	glowColor: string;
	grainColor: string;
	textureIntensity: number;
	textureColor: string;
};

// Tipos de estados
export type CardState = {
	hover: {
		scale: number;
		rotate: boolean;
		maxRotation: number;
		lift: boolean;
		liftHeight: number;
		duration: number;
		easing: string;
	};
	active: {
		scale: number;
		rotate: number;
		duration: number;
		easing: string;
	};
	disabled: boolean;
	selected: boolean;
};

// Tipos de sistema de diseño
export type DesignSystem = {
	preset: CardPreset;
	variant: CardVariant;
	aspectRatio: string;
	cornerStyle: CornerStyle;
	cornerRadius: string;
	borderStyle: BorderStyle;
	borderWidth: string;
	elevation: string;
	shadowStyle: ShadowStyle;
	textStyle: TextStyle;
	contentPadding: string;
};

// Tipos de rendimiento
export type Performance = {
	enableHardwareAcceleration: boolean;
	useRAF: boolean;
	batchUpdates: boolean;
	throttleMs: number;
};

// Tipos de metadatos
export type CardMetadata = {
	level?: number;
	type?: string;
	rarity?: string;
	class?: string;
	race?: string;
	alignment?: string;
	background?: string;
	[key: string]: any;
};

// Tipo principal de opciones de tarjeta
export type CardOptions = {
	// Identificación
	id: string;
	title: string;
	subtitle?: string;
	description: string;
	entityType: string;
	rarity?: string;

	// Sistema de diseño
	designSystem: DesignSystem;

	// Efectos visuales
	visualEffects: VisualEffect;

	// Estados
	states: CardState;

	// Rendimiento
	performance: Performance;

	// Metadatos
	metadata?: CardMetadata;

	// Badges
	badges?: string[];

	// Imágenes
	image?: {
		src: string;
		alt: string;
		width?: number;
		height?: number;
	};

	// Acciones
	onClick?: () => void;
	onHover?: (isHovered: boolean) => void;
	onSelect?: (isSelected: boolean) => void;
};
