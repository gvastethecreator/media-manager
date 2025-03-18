import type { CardOptions, CardState, DesignSystem, Performance, VisualEffect } from '../types/unified-card-types';

// Sistema de diseño por defecto
export const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
	preset: 'default',
	variant: 'standard',
	aspectRatio: 'aspect-[3/4]',
	cornerStyle: 'rounded',
	cornerRadius: 'md',
	borderStyle: 'solid',
	borderWidth: 'sm',
	elevation: 'md',
	shadowStyle: 'soft',
	textStyle: 'default',
	contentPadding: 'p-4',
};

// Efectos visuales por defecto
export const DEFAULT_VISUAL_EFFECTS: VisualEffect = {
	enableHolographic: true,
	enableGlow: true,
	enableGrain: true,
	holographicIntensity: 0.5,
	glowIntensity: 0.3,
	grainIntensity: 0.2,
	holographicColor: 'primary',
	glowColor: 'primary',
	grainColor: 'white',
	textureIntensity: 0.1,
	textureColor: 'white',
};

// Estados por defecto
export const DEFAULT_STATES: CardState = {
	hover: {
		scale: 1.05,
		rotate: true,
		maxRotation: 5,
		lift: true,
		liftHeight: 10,
		duration: 0.2,
		easing: 'easeInOut',
	},
	active: {
		scale: 0.95,
		rotate: 0,
		duration: 0.1,
		easing: 'easeInOut',
	},
	disabled: false,
	selected: false,
};

// Rendimiento por defecto
export const DEFAULT_PERFORMANCE: Performance = {
	enableHardwareAcceleration: true,
	useRAF: true,
	batchUpdates: true,
	throttleMs: 16,
};

// Opciones por defecto
export const DEFAULT_CARD_OPTIONS: CardOptions = {
	id: '',
	title: '',
	description: '',
	entityType: 'card',
	designSystem: DEFAULT_DESIGN_SYSTEM,
	visualEffects: DEFAULT_VISUAL_EFFECTS,
	states: DEFAULT_STATES,
	performance: DEFAULT_PERFORMANCE,
};

// Colores por rareza
export const RARITY_COLORS = {
	common: 'border-gray-400',
	uncommon: 'border-green-400',
	rare: 'border-blue-400',
	epic: 'border-purple-400',
	legendary: 'border-yellow-400',
	mythic: 'border-red-400',
};

// Efectos por rareza
export const RARITY_EFFECTS = {
	common: {
		glow: 'glow-gray-400',
		holographic: 'holographic-gray-400',
		texture: 'texture-gray-400',
	},
	uncommon: {
		glow: 'glow-green-400',
		holographic: 'holographic-green-400',
		texture: 'texture-green-400',
	},
	rare: {
		glow: 'glow-blue-400',
		holographic: 'holographic-blue-400',
		texture: 'texture-blue-400',
	},
	epic: {
		glow: 'glow-purple-400',
		holographic: 'holographic-purple-400',
		texture: 'texture-purple-400',
	},
	legendary: {
		glow: 'glow-yellow-400',
		holographic: 'holographic-yellow-400',
		texture: 'texture-yellow-400',
	},
	mythic: {
		glow: 'glow-red-400',
		holographic: 'holographic-red-400',
		texture: 'texture-red-400',
	},
};

// Animaciones
export const ANIMATIONS = {
	shine: {
		keyframes: {
			'0%': { transform: 'translateX(-100%)' },
			'100%': { transform: 'translateX(100%)' },
		},
		duration: '2s',
		timing: 'ease-in-out',
	},
	pulse: {
		keyframes: {
			'0%, 100%': { opacity: 1 },
			'50%': { opacity: 0.5 },
		},
		duration: '1s',
		timing: 'ease-in-out',
	},
	rotate: {
		keyframes: {
			'0%': { transform: 'rotate(0deg)' },
			'100%': { transform: 'rotate(360deg)' },
		},
		duration: '1s',
		timing: 'linear',
	},
};

// Efectos de capa
export const LAYER_EFFECTS = {
	backside: {
		gradient: 'bg-gradient-to-br from-background/80 to-background/40',
		border: 'border border-border/50',
	},
	border: {
		gradient: 'bg-gradient-to-r from-primary/20 to-secondary/20',
		blur: 'blur-xl',
	},
	content: {
		gradient: 'bg-gradient-to-b from-card/50 to-card/20',
		blur: 'backdrop-blur-sm',
	},
	description: {
		gradient: 'bg-gradient-to-b from-transparent to-card/20',
	},
	footer: {
		gradient: 'bg-gradient-to-t from-card/50 to-transparent',
	},
	glow: {
		gradient: 'bg-gradient-to-r from-primary/20 to-secondary/20',
		blur: 'blur-xl',
	},
	grain: {
		gradient: 'bg-gradient-to-br from-white/5 to-transparent',
		blend: 'mix-blend-overlay',
	},
	holographic: {
		gradient: 'bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20',
		blur: 'blur-xl',
	},
	texture: {
		gradient: 'bg-gradient-to-br from-white/5 to-transparent',
		blend: 'mix-blend-overlay',
	},
};
