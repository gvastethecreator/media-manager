import type * as React from 'react';
import type {
	BorderOptions,
	GlowEffectOptions,
	GrainEffectOptions,
	HolographicEffectOptions,
	ScanlinesOptions,
} from '../types/base-card-types';
import type { CardOptions } from '../types/card-settings-types';

// Sistema de rarezas para categorizar entidades
export interface RarityLevel {
	id: string;
	label: string;
	minValue: number;
	color: string;
	borderColor: string;
	gradient: string;
	badgeClass: string;
	barClass: string;
}

// Configuración por defecto para rarezas basadas en conteos
export const DEFAULT_RARITY_LEVELS: Record<string, RarityLevel> = {
	mythic: {
		id: 'mythic',
		label: 'Mítico',
		minValue: 100,
		color: 'from-orange-600/20 to-red-600/20',
		borderColor: 'border-orange-500/70',
		gradient: 'bg-gradient-to-r from-orange-500 to-red-500',
		badgeClass: 'bg-gradient-to-r from-orange-500 to-red-500',
		barClass: 'bg-gradient-to-r from-red-500 to-orange-500',
	},
	rare: {
		id: 'rare',
		label: 'Raro',
		minValue: 50,
		color: 'from-amber-500/20 to-yellow-600/20',
		borderColor: 'border-amber-500/70',
		gradient: 'bg-gradient-to-r from-amber-500 to-yellow-500',
		badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
		barClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
	},
	uncommon: {
		id: 'uncommon',
		label: 'Poco común',
		minValue: 20,
		color: 'from-emerald-500/20 to-teal-600/20',
		borderColor: 'border-emerald-500/70',
		gradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
		badgeClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
		barClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
	},
	common: {
		id: 'common',
		label: 'Común',
		minValue: 1,
		color: 'from-blue-500/20 to-sky-600/20',
		borderColor: 'border-blue-500/70',
		gradient: 'bg-gradient-to-r from-blue-500 to-sky-500',
		badgeClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
		barClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
	},
	empty: {
		id: 'empty',
		label: 'Vacío',
		minValue: 0,
		color: 'from-slate-500/20 to-gray-600/20',
		borderColor: 'border-slate-500/50',
		gradient: 'bg-gradient-to-r from-slate-500 to-gray-500',
		badgeClass: 'bg-gradient-to-r from-slate-500 to-gray-500',
		barClass: 'bg-gradient-to-r from-slate-500 to-gray-500',
	},
};

// Estadísticas comunes para entidades con imágenes
export interface EntityStats {
	imageCount?: number;
	size?: number;
	age?: string | number;
	ageText?: string;
	lastUpdated?: Date | null;
	createdAt?: Date | null;
	customStats?: Array<{
		icon: React.ReactNode;
		value: string | number;
		label: string;
		id?: string;
	}>;
}

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
const DEFAULT_HOLOGRAPHIC_OPTIONS: HolographicEffectOptions = {
	primaryColor: 'rgba(0, 153, 255, 0.1)',
	secondaryColor: 'rgba(128, 0, 255, 0.2)',
	intensity: 1,
	animationSpeed: 1,
	patternType: 'rainbow',
	visibleOnHover: true,
	layerIndex: 3,
};

const DEFAULT_SCANLINES_OPTIONS: ScanlinesOptions = {
	opacity: 0.2,
	spacing: 4,
	color: 'rgba(255,255,255,0.15)',
	animate: false,
	direction: 'horizontal',
	visibleOnHover: false,
	layerIndex: 2,
};

const DEFAULT_GLOW_OPTIONS: GlowEffectOptions = {
	color: 'rgba(0, 153, 255, 0.35)',
	intensity: 1,
	size: 100,
	blurAmount: 30,
	animationType: 'follow-mouse',
	pulseSpeed: 1.5,
	visibleOnHover: true,
	layerIndex: 4,
};

const DEFAULT_BORDER_OPTIONS: BorderOptions = {
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

const DEFAULT_GRAIN_OPTIONS: GrainEffectOptions = {
	intensity: 0.15,
	density: 0.6,
	contrast: 1.2,
	noise: 'light',
	animated: false,
	animationSpeed: 1,
	visibleOnHover: true,
	layerIndex: 6,
};

// Opciones visuales predeterminadas para todas las tarjetas
export const DEFAULT_VISUAL_OPTIONS: CardOptions = {
	// Opciones visuales básicas
	enable3DEffect: true,
	enableHolographicEffect: false,
	enableScanlines: false,
	enableGlow: true,
	enableBlurEffect: true,
	enableGrainEffect: false,

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

	// Estados
	states: {
		enableHover: true,
		enableFocus: true,
		enableActive: true,
		enableSelected: true,
		stateEffect: 'glow',
		stateIntensity: 1,
		stateDuration: 2,
	},

	// Rendimiento
	enableImageOptimization: true,
	enableVirtualization: true,
	enableCaching: true,
	hoverTransitionDuration: 300,
	hoverTransitionEasing: 'ease-out',
	rotationTransitionDuration: 300,
	liftTransitionDuration: 300,

	// Disposición del contenido
	contentLayout: 'default',
	contentAlignment: 'center',

	// Estilo de imagen
	imageStyle: 'cover',

	// Superposición de imagen
	imageOverlay: false,
	imageOverlayOpacity: 0.3,

	// Configuraciones de movimiento
	hoverLiftHeight: 10,
	maxRotation: 15,
	primaryColor: '#3b82f6',
	secondaryColor: '#1d4ed8',

	// Propiedades obligatorias según CardOptions
	imageGridLayout: 'single',
	imageGridGap: 8,
	imageGridStyle: 'standard',
	showImageCount: true,
	raritySystem: true,
	textureSystem: true,
	categorySystem: true,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableLazyLoading: true,
	showTitle: true,
	showType: true,
	showDescription: true,
	showRarity: true,
	showTexture: true,
	showInfo: true,
	enableShadow: true,
	cardShadowSize: 'md',
	cardShadowColor: 'rgba(0,0,0,0.2)',
	cardRoundedSize: 'md',
	enableHoverAnimation: true,
	cardBorderSize: 'none',
	enableParallaxEffect: false,
	enableSkeleton: true,
	enablePrefetch: false,
	enableHover: true,
	enableActive: true,
	enableFocus: true,
	enableDisabled: false,
};

// Función para calcular el nivel de rareza basado en un valor
export function getRarityLevel(
	value: number,
	levels: Record<string, RarityLevel> = DEFAULT_RARITY_LEVELS
): RarityLevel {
	const sortedLevels = Object.values(levels).sort((a, b) => b.minValue - a.minValue);

	for (const level of sortedLevels) {
		if (value >= level.minValue) {
			return level;
		}
	}

	// Si no coincide con ningún nivel, devolver el nivel más bajo
	return sortedLevels[sortedLevels.length - 1];
}

// Función para calcular el nivel de poder (1-12) basado en conteo y tamaño
export function calculatePowerLevel(imageCount: number, sizeInGB: number): number {
	const basePower = Math.min(9, Math.ceil(imageCount / 20));
	const sizeBonus = Math.min(3, Math.ceil(sizeInGB));

	// Valor entre 1-12
	return Math.max(1, Math.min(12, basePower + sizeBonus));
}

// Patrones de colores para thumbnail placeholders
export const THUMBNAIL_PLACEHOLDER_PATTERNS = [
	'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
	'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
	'linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)',
	'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
	'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
	'linear-gradient(120deg, #96deda 0%, #50c9c3 100%)',
];

// Función para obtener un patrón aleatorio para thumbnails
export function getRandomThumbnailPattern(): string {
	return THUMBNAIL_PLACEHOLDER_PATTERNS[Math.floor(Math.random() * THUMBNAIL_PLACEHOLDER_PATTERNS.length)];
}
