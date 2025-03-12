import type * as React from 'react';

// Opciones para presets de tipografía
export type TypographyPreset =
	| 'default'
	| 'modern'
	| 'classic'
	| 'elegant'
	| 'playful'
	| 'tech'
	| 'retro'
	| 'minimal'
	| 'bold';

// Opciones para diseños predefinidos de tarjetas
export type CardDesignPreset =
	| 'default'
	| 'album'
	| 'tag'
	| 'collection'
	| 'character'
	| 'place'
	| 'worldItem'
	| 'concept'
	| 'prompt'
	| 'note'
	| 'folder'
	| 'image'
	| 'gallery'
	| 'stats'
	| 'profile';

// Configuración de tipografía
export interface TypographyConfig {
	preset?: TypographyPreset;
	titleFont?: string;
	bodyFont?: string;
	metaFont?: string;
	titleSize?: string;
	bodySize?: string;
	metaSize?: string;
	titleWeight?: string | number;
	bodyWeight?: string | number;
	metaWeight?: string | number;
	titleColor?: string;
	bodyColor?: string;
	metaColor?: string;
	titleTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
	titleSpacing?: string;
	lineHeight?: string | number;
}

// Configuración de bordes
export interface BorderConfig {
	width?: string | number;
	style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
	color?: string;
	radius?: string | number;
	glow?: boolean;
	glowColor?: string;
	glowIntensity?: number;
	animation?: 'none' | 'pulse' | 'flow' | 'rainbow' | 'shimmer' | 'gradient';
	animated?: boolean;
	pattern?: 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient' | 'custom';
	customPattern?: string;
	gradientColors?: string[];
	gradientAngle?: number;
}

// Tipo para metadatos genéricos
export type MetadataValue = string | number | boolean | null | Record<string, string | number | boolean | null>;

// Opciones generales para el sistema de tarjetas
export interface CardOptions {
	// Opciones visuales básicas
	enable3DEffect?: boolean;
	enableHolographicEffect?: boolean;
	enableScanlinesEffect?: boolean;
	enableGlowEffect?: boolean;
	enableBorderEffect?: boolean;
	enableGrainEffect?: boolean;
	enableScanlines?: boolean;
	enableAnimatedBorder?: boolean;
	enableLightHalo?: boolean;

	// Sistema de rareza
	raritySystem?: {
		enabled?: boolean;
		defaultRarity?: string;
		rarities?: Record<string, RarityConfig>;
	};

	// Configuraciones específicas de efectos
	holographicOptions?: HolographicEffectOptions;
	scanlinesOptions?: ScanlinesOptions;
	glowOptions?: GlowEffectOptions;
	borderOptions?: BorderOptions;
	grainOptions?: GrainEffectOptions;

	// Sistema de diseño
	designSystem?: {
		preset?: CardDesignPreset;
		variant?: string;
		aspectRatio?: string;
		cornerStyle?: 'rounded' | 'sharp' | 'beveled';
		cornerRadius?: number;
		elevation?: number;
		shadowStyle?: 'soft' | 'hard' | 'layered' | 'none';
	};

	// Sistema de capas
	layerSystem?: {
		order?: string[];
		blendMode?: string;
		spacing?: number;
		explodeView?: boolean;
		explodeDistance?: number;
		explodeTransform?: ExplodeLayerTransformFunction;
	};

	// Estados e interactividad
	states?: CardStates;
	interactivity?: CardInteractivity;

	// Rendimiento
	performance?: {
		lazyLoad?: boolean;
		virtualScroll?: boolean;
		imageOptimization?: boolean;
		animationOptimization?: boolean;
		renderQuality?: 'low' | 'medium' | 'high';
	};

	// Disposición del contenido
	contentLayout?: 'default' | 'grid' | 'masonry' | 'carousel';
	contentPadding?: number | string;
	contentSpacing?: number;
	contentAlignment?: 'start' | 'center' | 'end';

	// Estilo de imagen
	imageStyle?: {
		fit?: 'cover' | 'contain' | 'fill' | 'none';
		position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
		quality?: 'low' | 'medium' | 'high' | 'auto';
	};

	// Superposición de imagen
	imageOverlay?: boolean;
	imageOverlayOpacity?: number;
	imageOverlayGradient?: string;

	// Configuraciones de movimiento
	hoverLiftHeight?: number;
	maxRotation?: number;
	primaryColor?: string;
	secondaryColor?: string;
}

// Opciones para el efecto holográfico
export interface HolographicEffectOptions {
	primaryColor?: string;
	secondaryColor?: string;
	intensity?: number;
	animationSpeed?: number;
	patternType?: string | 'rainbow' | 'linear' | 'radial' | 'diagonal';
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Opciones para efecto de brillo
export interface GlowEffectOptions {
	color?: string;
	intensity?: number;
	size?: number;
	blurAmount?: number;
	animationType?: string | 'static' | 'pulse' | 'follow-mouse' | 'none';
	pulseSpeed?: number;
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Opciones para efecto de textura
export interface TextureOptions {
	patternType?: string;
	imageUrl?: string;
	color?: string;
	opacity?: number;
	layerIndex?: number;
}

// Opciones para efecto de grano
export interface GrainEffectOptions {
	intensity?: number;
	density?: number;
	contrast?: number;
	noise?: string | 'digital' | 'film' | 'light' | 'heavy';
	animated?: boolean;
	animationSpeed?: number;
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Opciones para efecto de borde
export interface BorderOptions {
	width: number;
	pattern: 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient';
	color?: string;
	opacity?: number;
	blur?: number;
	spread?: number;
	animationType: 'none' | 'flow' | 'pulse' | 'rainbow' | 'shimmer';
	animationSpeed?: number;
	animationDuration?: number;
	glowColor?: string;
	glowIntensity?: number;
	glowOnHover?: boolean;
	layerIndex?: number;
	gradientColors?: string[];
	gradientAngle?: number;
	animation: {
		type: 'none' | 'flow' | 'pulse' | 'rainbow' | 'shimmer';
		duration?: number;
		timing?: string;
		delay?: number;
		iteration?: number | 'infinite';
	};
}

// Opciones para efecto de scanlines
export interface ScanlinesOptions {
	opacity?: number;
	density?: number;
	spacing?: number;
	color?: string;
	animate?: boolean;
	animationSpeed?: number;
	direction?: string | 'horizontal' | 'vertical' | 'diagonal';
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Configuración de rareza
export interface RarityConfig {
	name: string;
	color: string;
	borderEffect?: string;
	glowColor?: string;
	borderWidth?: string | number;
}

// Configuración de textura
export interface TextureConfig {
	name: string;
	patternType?: string;
	imageUrl?: string;
	color: string;
	opacity: number;
	scale?: number;
	blend?: string;
}

// Sistema de texturas
export interface TextureSystem {
	enabled: boolean;
	textures: Array<{
		id: string;
		name: string;
		imageUrl?: string;
		patternType?: string;
		color: string;
		opacity: number;
		description?: string;
		blendMode?: string;
		noiseType?: string;
		animated?: boolean;
		animationSpeed?: number;
		density?: number;
		contrast?: number;
		visibleOnHover?: boolean;
		layerOrder?: number;
		scale?: number;
	}>;
	entityType?: string;
}

// Capa para el modo de visualización "explosión"
export interface ExplodeLayer {
	id: string;
	label: string;
	icon: React.ReactNode;
	transform?: React.CSSProperties;
}

// Datos específicos para cada tipo de diseño de tarjeta
export interface CardDesignData {
	// Datos comunes
	id?: string;
	name?: string;
	description?: string;
	emoji?: string;
	color?: string;
	featuredImage?: string;
	images?: { url: string; alt?: string }[];
	stats?: Record<string, string | number>;
	metadata?: Record<string, MetadataValue>;
	type?: string;
	category?: string;

	// Datos específicos para Album
	albumInfo?: {
		totalImages?: number;
		filters?: string[];
		sortBy?: string;
	};

	// Datos específicos para Character
	characterInfo?: {
		level?: number;
		class?: string;
		race?: string;
		alignment?: string;
		stats?: {
			strength?: number;
			dexterity?: number;
			intelligence?: number;
			charisma?: number;
			[key: string]: number | undefined;
		};
	};

	// Datos específicos para Place
	placeInfo?: {
		region?: string;
		climate?: string;
		population?: number;
		type?: string;
		dangers?: string[];
	};

	// Datos específicos para WorldItem
	itemInfo?: {
		type?: string;
		properties?: string[];
		origin?: string;
	};

	// Datos específicos para Concept/Prompt/Note
	contentInfo?: {
		tags?: string[];
		category?: string;
		priority?: number;
		status?: string;
	};
}

// Funciones para cambios en la vista explosionada
export type ExplodeLayerTransformFunction = (layerIndex: number) => React.CSSProperties;

// Estados para las tarjetas
export interface CardStates {
	enableHover?: boolean;
	enableFocus?: boolean;
	enableActive?: boolean;
	enableSelected?: boolean;
	stateEffect?: string;
	stateIntensity?: number;
	stateDuration?: number;
	loading?: {
		skeleton?: boolean;
		spinner?: boolean;
		blur?: boolean;
	};
	error?: {
		style?: string;
		color?: string;
	};
	selected?: {
		style?: string;
		color?: string;
	};
	disabled?: {
		style?: string;
		opacity?: number;
	};
}

// Interactividad para tarjetas
export interface CardInteractivity {
	enableHoverEffects?: boolean;
	enableClickEffects?: boolean;
	enableDragInteraction?: boolean;
	enableContextMenu?: boolean;
	hover?: {
		scale?: number;
		rotate?: boolean;
		lift?: boolean;
		glow?: boolean;
	};
	click?: {
		feedback?: string;
		sound?: boolean;
		haptic?: boolean;
	};
	gestures?: {
		swipe?: boolean;
		pinch?: boolean;
		rotate?: boolean;
	};
}

// Props para el componente BaseCard
export interface BaseCardProps {
	children: React.ReactNode;
	className?: string;
	options?: Partial<CardOptions>;
	rarity?: RarityConfig;
	texture?: TextureConfig;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	onHoverStart?: () => void;
	onHoverEnd?: () => void;
	showVisualizationConfig?: boolean;
	onVisualizationConfigClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	enableExplode?: boolean;
	explodeLayers?: {
		id: string;
		label: string;
		icon: React.ReactNode;
	}[];
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
}

// Estado interno del BaseCard
export interface BaseCardState {
	isHovered: boolean;
	mousePosition: { x: number; y: number };
	rotateX: number;
	rotateY: number;
	isExploded: boolean;
	activeLayer: string | null;
}
