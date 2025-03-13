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

// Extendemos las opciones base de la tarjeta
export interface CardOptions {
	// Sistema de Diseño
	designSystem?: {
		preset?: string;
		variant?: string;
		aspectRatio?: string;
		cornerStyle?: string;
		cornerRadius?: number;
		elevation?: number;
		shadowStyle?: string;
	};

	// Configuración de Contenido
	contentLayout?: string;
	contentAlignment?: string;
	imageStyle?: string;
	imageOverlay?: boolean;
	imageOverlayOpacity?: number;

	// Configuración del grid de imágenes
	imageGridLayout: ImageGridLayout;
	imageGridGap: number;
	imageGridAspectRatio?: string;
	showImageCount: boolean;
	imageGridStyle: string;

	// Estados
	states?: {
		enableHover?: boolean;
		enableFocus?: boolean;
		enableActive?: boolean;
		enableSelected?: boolean;
		stateEffect?: string;
		stateIntensity?: number;
		stateDuration?: number;
	};

	// Sistemas
	raritySystem: boolean;
	textureSystem: boolean;
	categorySystem: boolean;

	// Efectos Visuales
	enable3DEffect: boolean;
	enableHolographicEffect: boolean;
	enableGlowEffect?: boolean;
	enableGrainEffect: boolean;
	enableLightHalo: boolean;
	enableAnimatedBorder: boolean;
	enableGlow: boolean;
	maxRotation: number;
	hoverLiftHeight: number;

	// Efectos Avanzados
	enableScanlines: boolean;

	// Rendimiento
	enableLazyLoading: boolean;
	enableImageOptimization?: boolean;
	enableVirtualization?: boolean;
	enableCaching?: boolean;
	animationDuration?: number;
	transitionDuration?: number;
	throttleDelay?: number;
	hoverTransitionDuration?: number;
	hoverTransitionEasing?: string;
	rotationTransitionDuration?: number;
	liftTransitionDuration?: number;

	// Visual
	showTitle: boolean;
	showType: boolean;
	showDescription: boolean;
	showRarity: boolean;
	showTexture: boolean;
	showInfo: boolean;

	// Opciones específicas para scanlines
	scanlinesOptions?: ScanlinesOptions;
	// Opciones específicas para efecto de grano
	grainOptions?: GrainEffectOptions;
	// Opciones específicas para borde animado
	borderOptions?: BorderOptions;

	// Sistema
	enableShadow: boolean;
	cardShadowSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
	cardShadowColor: string;
	cardRoundedSize: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

	// Avanzado
	enableHoverAnimation: boolean;
	cardBorderSize: 'none' | 'sm' | 'md' | 'lg';
	enableParallaxEffect: boolean;
	enableBlurEffect: boolean;

	// Rendimiento
	enableSkeleton: boolean;
	enablePrefetch: boolean;

	// Estados
	enableHover: boolean;
	enableActive: boolean;
	enableFocus: boolean;
	enableDisabled: boolean;

	// Colores
	primaryColor: string;
	secondaryColor: string;

	// Configuraciones específicas de efectos
	holographicOptions?: HolographicEffectOptions;
	glowOptions?: GlowEffectOptions;
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
