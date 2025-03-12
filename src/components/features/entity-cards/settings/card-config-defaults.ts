import type {
	BorderOptions,
	CardOptions,
	GlowEffectOptions,
	GrainEffectOptions,
	HolographicEffectOptions,
	RarityConfig,
	ScanlinesOptions,
	TextureConfig,
} from '../base/base-card-types';
import type { CardOptions as SettingsCardOptions } from './card-settings-types';

// Colores predeterminados para entidades
export const DEFAULT_ENTITY_COLORS = [
	'0, 153, 255', // Azul
	'128, 0, 255', // Púrpura
	'0, 204, 102', // Verde
	'255, 102, 0', // Naranja
	'255, 51, 153', // Rosa
	'51, 51, 255', // Azul intenso
	'153, 0, 0', // Rojo oscuro
	'255, 204, 0', // Amarillo
];

// Función para obtener un color aleatorio
export function getRandomEntityColor(): string {
	return DEFAULT_ENTITY_COLORS[Math.floor(Math.random() * DEFAULT_ENTITY_COLORS.length)];
}

// Configuraciones por defecto para cada tipo de efecto
export const DEFAULT_HOLOGRAPHIC_OPTIONS: HolographicEffectOptions = {
	primaryColor: 'rgba(0, 153, 255, 0.1)',
	secondaryColor: 'rgba(128, 0, 255, 0.2)',
	intensity: 1,
	animationSpeed: 1,
	patternType: 'rainbow',
	visibleOnHover: true,
	layerIndex: 3,
};

export const DEFAULT_SCANLINES_OPTIONS: ScanlinesOptions = {
	opacity: 0.2,
	spacing: 4,
	color: 'rgba(255,255,255,0.15)',
	animate: false,
	direction: 'horizontal',
	visibleOnHover: false,
	layerIndex: 2,
};

export const DEFAULT_GLOW_OPTIONS: GlowEffectOptions = {
	color: 'rgba(0, 153, 255, 0.35)',
	intensity: 1,
	size: 100,
	blurAmount: 30,
	animationType: 'follow-mouse',
	pulseSpeed: 1.5,
	visibleOnHover: true,
	layerIndex: 4,
};

export const DEFAULT_BORDER_OPTIONS: BorderOptions = {
	color: 'rgba(0, 153, 255, 1)',
	width: 2,
	pattern: 'solid',
	animationType: 'flow',
	glowColor: 'rgba(0, 153, 255, 0.7)',
	glowIntensity: 5,
	glowOnHover: true,
	layerIndex: 5,
	gradientColors: ['rgba(0, 153, 255, 1)', 'rgba(128, 0, 255, 1)'],
	gradientAngle: 45,
	animation: {
		type: 'flow',
		duration: 6,
		timing: 'linear',
		iteration: 'infinite',
	},
};

export const DEFAULT_GRAIN_OPTIONS: GrainEffectOptions = {
	intensity: 0.15,
	density: 0.6,
	contrast: 1.2,
	noise: 'light',
	animated: false,
	animationSpeed: 1,
	visibleOnHover: true,
	layerIndex: 6,
};

/**
 * Opciones visuales predeterminadas para tarjetas base de entidades
 */
export const DEFAULT_VISUAL_OPTIONS: CardOptions = {
	// Opciones visuales básicas
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,
	enableScanlines: true,
	enableAnimatedBorder: true,
	enableLightHalo: false,

	// Configuraciones específicas de efectos
	holographicOptions: DEFAULT_HOLOGRAPHIC_OPTIONS,
	scanlinesOptions: DEFAULT_SCANLINES_OPTIONS,
	glowOptions: DEFAULT_GLOW_OPTIONS,
	borderOptions: DEFAULT_BORDER_OPTIONS,
	grainOptions: DEFAULT_GRAIN_OPTIONS,

	// Sistema de diseño
	designSystem: {
		preset: 'default',
		variant: 'default',
		aspectRatio: '1/1',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Sistema de rareza
	raritySystem: {
		enabled: false,
		defaultRarity: 'common',
	},

	// Sistema de capas
	layerSystem: {
		order: ['background', 'content', 'effects', 'overlay'],
		blendMode: 'normal',
		spacing: 4,
		explodeView: false,
		explodeDistance: 20,
	},

	// Configuraciones de movimiento
	hoverLiftHeight: 10,
	maxRotation: 15,
	primaryColor: '0, 153, 255',
	secondaryColor: '128, 0, 255',
};

/**
 * Configuración visual predeterminada para tarjetas de entidades en el panel de configuraciones
 */
export const DEFAULT_SETTINGS_OPTIONS: SettingsCardOptions = {
	// Visual
	showTitle: true,
	showType: true,
	showDescription: true,
	showRarity: true,
	showTexture: true,
	showInfo: true,
	showImageCount: true,

	// Imagen
	imageGridLayout: 'single',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	imageGridAspectRatio: '1:1',

	// Efectos
	enableGlow: false,
	enableScanlines: false,
	enableGrainEffect: false,
	enableLightHalo: false,
	enableAnimatedBorder: false,
	enable3DEffect: true,
	enableHolographicEffect: true,
	maxRotation: 15,
	hoverLiftHeight: 10,

	// Opciones específicas para scanlines
	scanlinesOptions: {
		opacity: 0.2,
		spacing: 4,
		direction: 'horizontal',
		animate: true,
	},

	// Opciones específicas para efecto de grano
	grainOptions: {
		intensity: 0.2,
		density: 0.5,
		noise: 'light',
		animated: false,
	},

	// Opciones específicas para borde animado
	borderOptions: {
		width: 2,
		pattern: 'solid',
		animationType: 'pulse',
		animation: {
			type: 'pulse',
			duration: 3000,
			timing: 'linear',
			iteration: 'infinite',
		},
	},

	// Sistema
	enableShadow: true,
	cardShadowSize: 'md',
	cardShadowColor: 'rgba(0, 0, 0, 0.2)',
	cardRoundedSize: 'md',

	// Avanzado
	enableHoverAnimation: true,
	cardBorderSize: 'sm',
	enableParallaxEffect: false,
	enableBlurEffect: false,

	// Rendimiento
	enableSkeleton: true,
	enablePrefetch: false,
	enableLazyLoading: true,

	// Estados
	enableHover: true,
	enableActive: true,
	enableFocus: true,
	enableDisabled: false,

	// Sistemas
	raritySystem: false,
	textureSystem: false,
	categorySystem: false,

	// Colores
	primaryColor: '0, 153, 255',
	secondaryColor: '128, 0, 255',
};

// Configuraciones predefinidas para rarezas
export const DEFAULT_RARITIES: Record<string, RarityConfig> = {
	common: {
		name: 'Común',
		color: '#3b82f6',
		borderEffect: 'solid',
		glowColor: '#3b82f6',
	},
	uncommon: {
		name: 'Poco común',
		color: '#10b981',
		borderEffect: 'solid',
		glowColor: '#10b981',
	},
	rare: {
		name: 'Raro',
		color: '#f59e0b',
		borderEffect: 'animated',
		glowColor: '#f59e0b',
	},
	epic: {
		name: 'Épico',
		color: '#8b5cf6',
		borderEffect: 'animated',
		glowColor: '#8b5cf6',
	},
	legendary: {
		name: 'Legendario',
		color: '#8b5cf6',
		borderEffect: 'animated',
		glowColor: '#8b5cf6',
	},
	mythic: {
		name: 'Mítico',
		color: '#ec4899',
		borderEffect: 'animated',
		glowColor: '#ec4899',
	},
};

// Configuraciones predefinidas para texturas
export const DEFAULT_TEXTURES: Record<string, TextureConfig> = {
	none: {
		name: 'Ninguna',
		patternType: 'none',
		opacity: 0,
	},
	normal: {
		name: 'Normal',
		patternType: 'noise',
		opacity: 0.05,
	},
	paper: {
		name: 'Papel',
		patternType: 'paper',
		opacity: 0.1,
	},
	metal: {
		name: 'Metal',
		patternType: 'metal',
		opacity: 0.2,
	},
	carbon: {
		name: 'Carbono',
		patternType: 'carbon',
		opacity: 0.15,
	},
	wood: {
		name: 'Madera',
		patternType: 'wood',
		opacity: 0.2,
	},
	holographic: {
		name: 'Holográfico',
		patternType: 'diagonal',
		opacity: 0.5,
	},
	metallic: {
		name: 'Metálico',
		patternType: 'lines',
		opacity: 0.4,
	},
	prismatic: {
		name: 'Prismático',
		patternType: 'grid',
		opacity: 0.6,
	},
	rainbow: {
		name: 'Arcoíris',
		patternType: 'waves',
		opacity: 0.5,
	},
};
