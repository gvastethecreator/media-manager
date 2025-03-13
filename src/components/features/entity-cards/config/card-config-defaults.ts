import type {
	BorderOptions,
	CardOptions,
	CardStates,
	GlowEffectOptions,
	GrainEffectOptions,
	HolographicEffectOptions,
	RarityConfig,
	ScanlinesOptions,
	TextureConfig,
} from '../types/base-card-types';
import type { CardOptions as SettingsCardOptions } from '../types/card-settings-types';

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

// Estados predeterminados para las tarjetas
export const DEFAULT_CARD_STATES: CardStates = {
	enableHover: true,
	enableFocus: true,
	enableActive: true,
	enableSelected: true,
	stateEffect: 'glow',
	stateIntensity: 1,
	stateDuration: 2,
	loading: {
		skeleton: true,
		spinner: false,
		blur: false,
	},
	error: {
		style: 'border',
		color: 'red',
	},
	selected: {
		style: 'border',
		color: 'blue',
	},
	disabled: {
		style: 'opacity',
		opacity: 0.5,
	},
};

// Configuraciones por defecto para efectos adicionales
export const DEFAULT_GLITCH_EFFECT = {
	enabled: false,
	visibleOnHover: true,
	intensity: 0.5,
	frequency: 0.1,
	duration: 0.2,
	color: 'rgba(0, 153, 255, 0.5)',
	layerIndex: 7,
};

export const DEFAULT_NOISE_TEXTURE = {
	enabled: false,
	visibleOnHover: true,
	intensity: 0.3,
	scale: 1,
	color: 'rgba(255, 255, 255, 0.1)',
	layerIndex: 8,
};

export const DEFAULT_CHROMATIC_ABERRATION = {
	enabled: false,
	visibleOnHover: true,
	intensity: 0.5,
	offset: 0.1,
	color: 'rgba(0, 153, 255, 0.5)',
	layerIndex: 8,
};

export const DEFAULT_PIXELATE = {
	enabled: false,
	visibleOnHover: true,
	intensity: 0.5,
	blockSize: 4,
	color: 'rgba(0, 153, 255, 0.5)',
	layerIndex: 9,
};

// Configuraciones de rendimiento optimizadas
export const DEFAULT_PERFORMANCE_OPTIONS = {
	// Optimizaciones generales
	lazyLoad: true,
	virtualScroll: false,
	imageOptimization: true,
	animationOptimization: true,
	renderQuality: 'high' as const,

	// Optimizaciones de capas
	layerOptimization: {
		// Límites de capas
		maxLayers: 10,
		maxActiveLayers: 3,

		// Estrategias de renderizado
		renderStrategy: 'smart' as const, // 'smart' | 'all' | 'active'

		// Prioridades de capas
		layerPriorities: {
			content: 1,
			patterns: 2,
			textures: 3,
			distortions: 4,
			glows: 5,
			borders: 6,
			scanlines: 7,
			holographic: 8,
			shaders: 9,
			filters: 10,
		},

		// Optimizaciones de memoria
		memoryOptimization: {
			maxTextureSize: 2048,
			textureCompression: true,
			textureFormat: 'webp' as const,
		},

		// Optimizaciones de animación
		animationOptimization: {
			maxFPS: 60,
			reducedMotion: false,
			animationDuration: 300,
			animationTimingFunction: 'ease-out',
		},
	},
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

	// Estados
	states: DEFAULT_CARD_STATES,

	// Configuraciones de movimiento
	hoverLiftHeight: 10,
	maxRotation: 15,
	primaryColor: '0, 153, 255',
	secondaryColor: '128, 0, 255',

	// Efectos adicionales
	effects: {
		glitchEffect: DEFAULT_GLITCH_EFFECT,
		noiseTexture: DEFAULT_NOISE_TEXTURE,
		chromaticAberration: DEFAULT_CHROMATIC_ABERRATION,
		pixelate: DEFAULT_PIXELATE,
		shaders: {
			enabled: false,
			distortion: {
				visibleOnHover: true,
				intensity: 0.5,
				duration: 1000,
			},
			hologram: {
				visibleOnHover: true,
				intensity: 0.5,
				duration: 1000,
				primaryColor: [0, 153, 255],
				secondaryColor: [128, 0, 255],
			},
			particles: {
				visibleOnHover: true,
				intensity: 0.5,
				duration: 1000,
				particleColor: [0, 153, 255],
			},
			waves: {
				visibleOnHover: true,
				intensity: 0.5,
				duration: 1000,
				waveColor: [0, 153, 255],
			},
		},
		patterns: {
			enabled: false,
			dots: {
				visibleOnHover: true,
				opacity: 0.5,
				scale: 1,
				rotation: 0,
				color: 'rgba(0, 153, 255, 0.5)',
				dotSize: 2,
				spacing: 4,
			},
			grid: {
				visibleOnHover: true,
				opacity: 0.5,
				scale: 1,
				rotation: 0,
				color: 'rgba(0, 153, 255, 0.5)',
				lineWidth: 1,
				spacing: 4,
			},
			hexagons: {
				visibleOnHover: true,
				opacity: 0.5,
				scale: 1,
				rotation: 0,
				color: 'rgba(0, 153, 255, 0.5)',
				size: 4,
				spacing: 4,
			},
			lines: {
				visibleOnHover: true,
				opacity: 0.5,
				scale: 1,
				rotation: 0,
				color: 'rgba(0, 153, 255, 0.5)',
				lineWidth: 1,
				spacing: 4,
				angle: 45,
			},
		},
		filters: {
			enabled: false,
			distortion: {
				visibleOnHover: true,
				opacity: 0.5,
				intensity: 0.5,
				color: 'rgba(0, 153, 255, 0.5)',
				frequency: 0.1,
				amplitude: 0.1,
			},
			glow: {
				visibleOnHover: true,
				opacity: 0.5,
				intensity: 0.5,
				color: 'rgba(0, 153, 255, 0.5)',
				radius: 10,
				spread: 5,
			},
			shadow: {
				visibleOnHover: true,
				opacity: 0.5,
				intensity: 0.5,
				color: 'rgba(0, 0, 0, 0.5)',
				offsetX: 0,
				offsetY: 2,
				blur: 4,
			},
		},
	},

	// Rendimiento
	performance: DEFAULT_PERFORMANCE_OPTIONS,
};

/**
 * Configuración visual predeterminada para tarjetas de entidades en el panel de configuraciones
 */
export const DEFAULT_SETTINGS_OPTIONS: SettingsCardOptions = {
	// Sistemas
	raritySystem: false,
	textureSystem: false,
	categorySystem: false,

	// Sistema de diseño
	designSystem: {
		preset: 'default',
		variant: 'default',
		aspectRatio: '1:1',
		cornerStyle: 'rounded',
		cornerRadius: 8,
		elevation: 1,
		shadowStyle: 'soft',
	},

	// Grid de imágenes
	imageGrid: {
		layout: 'grid',
		gap: 4,
		style: 'standard',
		aspectRatio: '1:1',
	},

	// Rendimiento
	performance: {
		lazyLoad: true,
		prefetch: false,
		reducedMotion: false,
		animationDuration: 300,
		animationMaxFPS: 60,
		animationTimingFunction: 'ease-out',
	},

	// Efectos básicos
	enable3DEffect: false,
	enableHolographicEffect: false,
	enableScanlinesEffect: false,
	enableGlowEffect: false,
	enableBorderEffect: false,
	enableGrainEffect: false,
	enableScanlines: false,
	enableAnimatedBorder: false,
	enableLightHalo: false,

	// Efectos de distorsión
	effects: {
		enabled: false,
		visibleOnHover: false,
		intensity: 1,
		glitchEffect: {
			enabled: false,
			visibleOnHover: false,
			intensity: 0.5,
			frequency: 0.1,
			duration: 0.2,
		},
		chromaticAberration: {
			enabled: false,
			visibleOnHover: false,
			intensity: 0.5,
			offset: 0.1,
		},
		pixelate: {
			enabled: false,
			visibleOnHover: false,
			intensity: 0.5,
			blockSize: 4,
		},
	},

	// Opciones de efectos
	scanlinesOptions: {
		enabled: false,
		opacity: 0.2,
		spacing: 4,
		color: 'rgba(0,0,0,0.2)',
		animate: false,
		direction: 'horizontal',
		visibleOnHover: false,
	},

	// Otros valores
	hoverLiftHeight: 10,
	maxRotation: 15,
	primaryColor: '0,0,0',
	secondaryColor: '255,255,255',
} as const;

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
		color: '#ffffff',
	},
	normal: {
		name: 'Normal',
		patternType: 'noise',
		opacity: 0.05,
		color: '#f0f0f0',
	},
	paper: {
		name: 'Papel',
		patternType: 'paper',
		opacity: 0.1,
		color: '#f5f5f5',
	},
	metal: {
		name: 'Metal',
		patternType: 'metal',
		opacity: 0.2,
		color: '#b6b6b6',
	},
	carbon: {
		name: 'Carbono',
		patternType: 'carbon',
		opacity: 0.15,
		color: '#2c2c2c',
	},
	wood: {
		name: 'Madera',
		patternType: 'wood',
		opacity: 0.2,
		color: '#8B4513',
	},
	holographic: {
		name: 'Holográfico',
		patternType: 'diagonal',
		opacity: 0.5,
		color: '#8a2be2',
	},
	metallic: {
		name: 'Metálico',
		patternType: 'lines',
		opacity: 0.4,
		color: '#c0c0c0',
	},
	prismatic: {
		name: 'Prismático',
		patternType: 'grid',
		opacity: 0.6,
		color: '#6f42c1',
	},
	rainbow: {
		name: 'Arcoíris',
		patternType: 'waves',
		opacity: 0.5,
		color: '#ff6b6b',
	},
};
