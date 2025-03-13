import type { EffectsOptions } from '../types/card-settings-types';

// Configuración de capas para efectos
export const LAYER_ORDER = {
	// Capas base
	background: 0,
	content: 1,
	effects: 2,
	overlay: 3,

	// Efectos específicos
	patterns: 4,
	textures: 5,
	distortions: 6,
	glows: 7,
	borders: 8,
	scanlines: 9,
	holographic: 10,
	shaders: 11,
	filters: 12,
} as const;

// Configuración de prioridades para efectos
export const EFFECT_PRIORITIES = {
	// Efectos de distorsión
	glitch: 1,
	chromaticAberration: 2,
	pixelate: 3,

	// Shaders
	distortion: 4,
	hologram: 5,
	particles: 6,
	wave: 7,

	// Patrones
	dots: 8,
	grid: 9,
	hexagons: 10,
	lines: 11,

	// Filtros
	filterDistortion: 12,
	filterGlow: 13,
	filterShadow: 14,
} as const;

// Función para obtener el índice de capa para un efecto específico
export function getEffectLayerIndex(effect: keyof EffectsOptions): number {
	switch (effect) {
		case 'glitchEffect':
			return LAYER_ORDER.distortions;
		case 'chromaticAberration':
			return LAYER_ORDER.distortions;
		case 'pixelate':
			return LAYER_ORDER.distortions;
		case 'shaders':
			return LAYER_ORDER.shaders;
		case 'patterns':
			return LAYER_ORDER.patterns;
		case 'filters':
			return LAYER_ORDER.filters;
		default:
			return LAYER_ORDER.effects;
	}
}

// Función para obtener la prioridad de un efecto específico
export function getEffectPriority(effect: string): number {
	switch (effect) {
		case 'glitch':
			return EFFECT_PRIORITIES.glitch;
		case 'chromaticAberration':
			return EFFECT_PRIORITIES.chromaticAberration;
		case 'pixelate':
			return EFFECT_PRIORITIES.pixelate;
		case 'distortion':
			return EFFECT_PRIORITIES.distortion;
		case 'hologram':
			return EFFECT_PRIORITIES.hologram;
		case 'particles':
			return EFFECT_PRIORITIES.particles;
		case 'wave':
			return EFFECT_PRIORITIES.wave;
		case 'dots':
			return EFFECT_PRIORITIES.dots;
		case 'grid':
			return EFFECT_PRIORITIES.grid;
		case 'hexagons':
			return EFFECT_PRIORITIES.hexagons;
		case 'lines':
			return EFFECT_PRIORITIES.lines;
		case 'filterDistortion':
			return EFFECT_PRIORITIES.filterDistortion;
		case 'filterGlow':
			return EFFECT_PRIORITIES.filterGlow;
		case 'filterShadow':
			return EFFECT_PRIORITIES.filterShadow;
		default:
			return 0;
	}
}

// Función para ordenar efectos por prioridad
export function sortEffectsByPriority(effects: EffectsOptions): EffectsOptions {
	const sortedEffects: EffectsOptions = {
		enabled: effects.enabled,
		visibleOnHover: effects.visibleOnHover,
		intensity: effects.intensity,
	};

	// Ordenar efectos de distorsión
	if (effects.glitchEffect) {
		sortedEffects.glitchEffect = {
			...effects.glitchEffect,
			layerIndex: getEffectLayerIndex('glitchEffect'),
		};
	}
	if (effects.chromaticAberration) {
		sortedEffects.chromaticAberration = {
			...effects.chromaticAberration,
			layerIndex: getEffectLayerIndex('chromaticAberration'),
		};
	}
	if (effects.pixelate) {
		sortedEffects.pixelate = {
			...effects.pixelate,
			layerIndex: getEffectLayerIndex('pixelate'),
		};
	}

	// Ordenar shaders
	if (effects.shaders) {
		sortedEffects.shaders = {
			...effects.shaders,
			distortion: effects.shaders.distortion
				? {
						...effects.shaders.distortion,
						layerIndex: getEffectLayerIndex('shaders'),
					}
				: undefined,
			hologram: effects.shaders.hologram
				? {
						...effects.shaders.hologram,
						layerIndex: getEffectLayerIndex('shaders'),
					}
				: undefined,
			particles: effects.shaders.particles
				? {
						...effects.shaders.particles,
						layerIndex: getEffectLayerIndex('shaders'),
					}
				: undefined,
			wave: effects.shaders.wave
				? {
						...effects.shaders.wave,
						layerIndex: getEffectLayerIndex('shaders'),
					}
				: undefined,
		};
	}

	// Ordenar patrones
	if (effects.patterns) {
		sortedEffects.patterns = {
			...effects.patterns,
			dots: effects.patterns.dots
				? {
						...effects.patterns.dots,
						layerIndex: getEffectLayerIndex('patterns'),
					}
				: undefined,
			grid: effects.patterns.grid
				? {
						...effects.patterns.grid,
						layerIndex: getEffectLayerIndex('patterns'),
					}
				: undefined,
			hexagons: effects.patterns.hexagons
				? {
						...effects.patterns.hexagons,
						layerIndex: getEffectLayerIndex('patterns'),
					}
				: undefined,
			lines: effects.patterns.lines
				? {
						...effects.patterns.lines,
						layerIndex: getEffectLayerIndex('patterns'),
					}
				: undefined,
		};
	}

	// Ordenar filtros
	if (effects.filters) {
		sortedEffects.filters = {
			...effects.filters,
			distortion: effects.filters.distortion
				? {
						...effects.filters.distortion,
						layerIndex: getEffectLayerIndex('filters'),
					}
				: undefined,
			glow: effects.filters.glow
				? {
						...effects.filters.glow,
						layerIndex: getEffectLayerIndex('filters'),
					}
				: undefined,
			shadow: effects.filters.shadow
				? {
						...effects.filters.shadow,
						layerIndex: getEffectLayerIndex('filters'),
					}
				: undefined,
		};
	}

	return sortedEffects;
}
