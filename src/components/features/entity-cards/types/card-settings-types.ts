import type { RaritySystem } from '@/app/actions/entities-cards/entities-cards.actions';
import type {
	BorderOptions,
	GlowEffectOptions,
	GrainEffectOptions,
	HolographicEffectOptions,
	RarityConfig,
	ScanlinesOptions,
	TextureConfig,
	TextureSystem,
} from '@/components/features/entity-cards/types/base-card-types';
import type { ReactNode } from 'react';

// Tipo para la configuración del grid de imágenes
export type ImageGridLayout = 'single' | 'dual' | 'quad' | 'six';

export interface ImageGrid {
	layout?: 'single' | 'dual' | 'grid';
	gap?: number;
	style?: 'standard' | 'masonry' | 'carousel';
	aspectRatio?: string;
}

// Extendemos las opciones base de la tarjeta
export interface CardOptions {
	// Diseño
	enable3DEffect?: boolean;
	designSystem?: {
		preset?: string;
		variant?: string;
		aspectRatio?: string;
		cornerStyle?: 'rounded' | 'sharp';
		elevation?: number;
	};

	// Efectos Básicos
	enableHolographicEffect?: boolean;
	enableGlowEffect?: boolean;
	enableAnimatedBorder?: boolean;
	enableLightHalo?: boolean;

	// Sistema de Capas
	layerSystem?: {
		order?: string[];
		layerBlending?: 'normal' | 'multiply' | 'screen' | 'overlay';
		layerSpacing?: number;
	};

	// Efectos
	effects?: {
		shadow?: {
			enabled?: boolean;
			color?: string;
			blur?: number;
			spread?: number;
		};
		reflection?: {
			enabled?: boolean;
			opacity?: number;
			blur?: number;
		};
		parallax?: {
			enabled?: boolean;
			intensity?: number;
			perspective?: number;
		};
	};

	// Rendimiento
	performance?: {
		enableHardwareAcceleration?: boolean;
		useRAF?: boolean;
		batchUpdates?: boolean;
		throttleMs?: number;
	};

	// Estados
	states?: {
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
	};

	// Visual
	showTitle?: boolean;
	showType?: boolean;
	showDescription?: boolean;
	showRarity?: boolean;
	showTexture?: boolean;
	showInfo?: boolean;
	showImageCount?: boolean;

	// Imagen
	imageGrid?: ImageGrid;

	// Efectos
	enableScanlines?: boolean;
	enableGrainEffect?: boolean;

	// Opciones específicas para efectos
	scanlinesOptions?: ScanlinesOptions;
	grainOptions?: GrainEffectOptions;
	borderOptions?: BorderOptions;
	holographicOptions?: HolographicEffectOptions;
	glowOptions?: GlowEffectOptions;
	effects?: DistortionEffects;

	// Sistema
	enableShadow?: boolean;
	cardShadowSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
	cardShadowColor?: string;
	cardRoundedSize?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
	cardBorderSize?: 'none' | 'sm' | 'md' | 'lg';

	// Avanzado
	enableHoverAnimation?: boolean;
	enableParallaxEffect?: boolean;
	enableBlurEffect?: boolean;

	// Rendimiento
	enableSkeleton?: boolean;
	enablePrefetch?: boolean;
	enableLazyLoading?: boolean;

	// Sistemas
	raritySystem?: boolean;
	textureSystem?: boolean;
	categorySystem?: boolean;

	// Colores
	primaryColor?: string;
	secondaryColor?: string;

	// Estados y Animaciones
	states?: {
		hover?: boolean;
		focus?: boolean;
		active?: boolean;
		selected?: boolean;
		hoverScale?: number;
		hoverRotate?: number;
		hoverTranslateY?: number;
		focusScale?: number;
		focusRotate?: number;
		focusTranslateY?: number;
		activeScale?: number;
		activeRotate?: number;
		activeTranslateY?: number;
		selectedScale?: number;
		selectedRotate?: number;
		selectedTranslateY?: number;
	};

	// Efectos Visuales
	visualEffects?: {
		// Ajustes de imagen
		brightness?: number;
		contrast?: number;
		saturate?: number;
		hueRotate?: number;

		// Filtros de estilo
		grayscale?: number;
		sepia?: number;
		invert?: number;
		opacity?: number;

		// Efectos de desenfoque
		blur?: number;
		dropShadow?: boolean;

		// Efectos de fondo
		backdropBlur?: number;
		backdropBrightness?: number;
		backdropSaturate?: number;
		backdropOpacity?: number;
	};

	// Rendimiento
	performance?: {
		// Optimización de carga
		lazyLoad?: boolean;
		imageOptimization?: boolean;
		prefetchOnHover?: boolean;
		placeholderImage?: boolean;
		useSkeletonLoading?: boolean;

		// Virtualización y Caché
		virtualizeList?: boolean;
		cacheStrategy?: 'none' | 'memory' | 'persistent';
		enableHardwareAcceleration?: boolean;

		// Animaciones y Transiciones
		reducedMotion?: boolean;
		animationDuration?: number;
		animationMaxFPS?: number;
		animationTimingFunction?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

		// Respuesta y Retrasos
		debounceTime?: number;
		transitionDelay?: number;
	};

	// Efectos Avanzados
	effects: EffectsOptions;
}

export interface CardSettingsProps {
	cardOptions: CardOptions;
	onCardOptionsChange: (options: CardOptions) => void;
}

export interface SystemSettingsProps extends CardSettingsProps {
	entityType: string;
	onRarityChange: (rarity: RarityConfig | null) => void;
	onTextureChange: (texture: TextureConfig | null) => void;
	raritySystem?: RaritySystem;
	textureSystem?: TextureSystem;
	accordionMode?: boolean;
}

export interface PreviewPanelProps {
	cardOptions: CardOptions;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	showInfo?: boolean;
	entityType?: string;
}

export interface CardPresetOption {
	id: string;
	name: string;
	description: string;
	options: CardOptions;
}

// Renombrar para diferenciar de la interfaz base
export type { BorderOptions as SettingsBorderOptions };

export interface CardConfigFormData {
	entityType: string;
	cardOptions: CardOptions;
}

export interface RaritySystemOptions {
	rarities: Record<string, RarityConfig>;
	defaultRarity: string;
	showRarityBadge: boolean;
	showRarityName: boolean;
	rarityPlacement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface TextureSystemOptions {
	textures: Record<string, TextureConfig>;
	defaultTexture: string;
	enableTextures: boolean;
	textureOpacity: number;
}

export interface CardPresetDto {
	id: string;
	name: string;
	description?: string;
	entityType: string;
	isDefault?: boolean;
	options: CardOptions;
	createdAt?: string;
	updatedAt?: string;
}

export interface ShaderOptions {
	enabled: boolean;
	visibleOnHover: boolean;
	intensity: number;
	frequency?: number;
	amplitude?: number;
	scanlineSpeed?: number;
	scanlineDensity?: number;
	color?: string;
	particleCount?: number;
	particleSize?: number;
	speed?: number;
}

export interface PatternOptions {
	enabled: boolean;
	visibleOnHover: boolean;
	opacity: number;
	scale: number;
	rotation: number;
	dotSize?: number;
	spacing?: number;
	lineWidth?: number;
	size?: number;
	angle?: number;
}

export interface FilterOptions {
	enabled: boolean;
	visibleOnHover: boolean;
	intensity: number;
	frequency?: number;
	amplitude?: number;
	radius?: number;
	color?: string;
	blur?: number;
	offsetX?: number;
	offsetY?: number;
}

export interface EffectsOptions {
	enabled: boolean;
	visibleOnHover: boolean;
	intensity: number;
	// Efectos de distorsión
	glitchEffect?: {
		enabled: boolean;
		visibleOnHover: boolean;
		intensity: number;
		frequency: number;
		duration: number;
		color?: string;
		layerIndex?: number;
	};
	chromaticAberration?: {
		enabled: boolean;
		visibleOnHover: boolean;
		intensity: number;
		offset: number;
		color?: string;
		layerIndex?: number;
	};
	pixelate?: {
		enabled: boolean;
		visibleOnHover: boolean;
		intensity: number;
		blockSize: number;
		color?: string;
		layerIndex?: number;
	};
	// Shaders
	shaders?: {
		distortion?: ShaderOptions;
		hologram?: ShaderOptions;
		particles?: ShaderOptions;
		wave?: ShaderOptions;
	};
	// Patrones
	patterns?: {
		dots?: PatternOptions;
		grid?: PatternOptions;
		hexagons?: PatternOptions;
		lines?: PatternOptions;
	};
	// Filtros
	filters?: {
		distortion?: FilterOptions;
		glow?: FilterOptions;
		shadow?: FilterOptions;
	};
}

export interface DistortionEffects {
	enabled?: boolean;
	visibleOnHover?: boolean;
	intensity?: number;
	glitchEffect?: {
		enabled?: boolean;
		visibleOnHover?: boolean;
		intensity?: number;
		frequency?: number;
		duration?: number;
	};
	chromaticAberration?: {
		enabled?: boolean;
		visibleOnHover?: boolean;
		intensity?: number;
		offset?: number;
	};
	pixelate?: {
		enabled?: boolean;
		visibleOnHover?: boolean;
		intensity?: number;
		blockSize?: number;
	};
}
