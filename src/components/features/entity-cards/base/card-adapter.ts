/**
 * Adaptadores para convertir entre diferentes formatos de opciones de tarjetas
 * Este archivo proporciona funciones para adaptar opciones entre diferentes sistemas
 */

import type { BaseLayerConfig } from '../layers/layer-plugin-system';
import type { CardOptions } from '../types/card-settings-types';

/**
 * Adapta opciones base a formato de configuración de settings
 * @param options Opciones en formato base o genérico
 * @returns Opciones en formato compatible con el panel de settings
 */
export function adaptBaseToSettingsOptions(options: Record<string, unknown>): CardOptions {
	// Crear un objeto base para las opciones de configuración
	const settingsOptions: CardOptions = {
		// Propiedades básicas
		enable3DEffect: options.enable3DEffect as boolean,
		enableHolographicEffect: options.enableHolographicEffect as boolean,
		enableGlowEffect: options.enableGlowEffect as boolean,
		enableAnimatedBorder: options.enableAnimatedBorder as boolean,
		enableLightHalo: options.enableLightHalo as boolean,
		enableScanlines: options.enableScanlines as boolean,
		enableGrainEffect: options.enableGrainEffect as boolean,

		// Sistema de diseño
		designSystem: options.designSystem as CardOptions['designSystem'],

		// Sistema de capas
		layerSystem: options.layerSystem as CardOptions['layerSystem'],
		layerConfigs: options.layerConfigs as Record<string, BaseLayerConfig>,
		layerOrder: options.layerOrder as string[],
		explodeView: options.explodeView as boolean,
		explodeDistance: options.explodeDistance as number,

		// Sistemas de módulos
		animation: options.animation as CardOptions['animation'],
		design: options.design as CardOptions['design'],
		explode: options.explode as CardOptions['explode'],

		// Efectos
		effects: options.effects as CardOptions['effects'],

		// Rendimiento
		performance: options.performance as CardOptions['performance'],

		// Estados
		states: options.states as CardOptions['states'],

		// Visibilidad de elementos
		showTitle: options.showTitle as boolean,
		showType: options.showType as boolean,
		showDescription: options.showDescription as boolean,
		showRarity: options.showRarity as boolean,
		showTexture: options.showTexture as boolean,
		showInfo: options.showInfo as boolean,
		showImageCount: options.showImageCount as boolean,

		// Imagen
		imageGrid: options.imageGrid as CardOptions['imageGrid'],

		// Opciones específicas para efectos
		scanlinesOptions: options.scanlinesOptions as CardOptions['scanlinesOptions'],
		grainOptions: options.grainOptions as CardOptions['grainOptions'],
		borderOptions: options.borderOptions as CardOptions['borderOptions'],
		holographicOptions: options.holographicOptions as CardOptions['holographicOptions'],
		glowOptions: options.glowOptions as CardOptions['glowOptions'],
	};

	return settingsOptions;
}

/**
 * Adapta opciones de settings a formato base
 * @param options Opciones en formato de panel de settings
 * @returns Opciones en formato base compatible con componentes de tarjeta
 */
export function adaptSettingsToBaseOptions(options: CardOptions): Record<string, unknown> {
	// Crear un objeto base para las opciones
	return {
		...options,
		// Aquí se pueden añadir transformaciones específicas si son necesarias
	};
}

/**
 * Genera una configuración de rareza para una entidad
 * @param level El nivel de rareza
 * @param color El color base (opcional)
 * @returns La configuración de rareza
 */
export function generateRarityConfig(level: string, color: string = '#3b82f6') {
	return {
		name: level,
		color,
		borderWidth: level === 'common' ? '1px' : level === 'uncommon' ? '2px' : '3px',
		borderEffect: level === 'common' ? 'static' : level === 'uncommon' ? 'pulse' : 'glow',
	};
}

/**
 * Adapta opciones para un layout específico
 * @param options Opciones generales
 * @param layoutType Tipo de layout
 * @returns Opciones adaptadas para el layout específico
 */
export function adaptOptionsForLayout(options: CardOptions, layoutType: string): CardOptions {
	// Clonar las opciones para no modificar el original
	const adaptedOptions = { ...options };

	// Aplicar ajustes específicos según el tipo de layout
	switch (layoutType) {
		case 'folder':
			adaptedOptions.showDescription = false;
			adaptedOptions.showRarity = false;
			break;
		case 'album':
			adaptedOptions.showImageCount = true;
			break;
		case 'character':
			adaptedOptions.enableHolographicEffect = true;
			break;
		// Añadir más casos según sea necesario
	}

	return adaptedOptions;
}
