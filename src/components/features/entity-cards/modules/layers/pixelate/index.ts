import type { LayerComponent } from '../layer-plugin-system';
import { deletePixelateConfig, getPixelateConfig, updatePixelateConfig } from './actions';
import { PixelateEffectLayer } from './pixelate-effect-layer';
import { PixelateSettings } from './pixelate-settings';
import { createDefaultPixelateConfig, pixelateConfigSchema } from './pixelate-schema';
import type { PixelateConfig } from './pixelate-schema';

/**
 * Definición de la capa Pixelate para el sistema de plugins
 */
export const pixelateLayer: LayerComponent<PixelateConfig> = {
	type: 'pixelate',
	Component: PixelateEffectLayer,
	SettingsComponent: PixelateSettings,
	defaultConfig: createDefaultPixelateConfig(),
	schema: pixelateConfigSchema,
	getServerActions: () => ({
		getConfig: getPixelateConfig,
		updateConfig: updatePixelateConfig,
		deleteConfig: deletePixelateConfig,
	}),
};

/**
 * Exportaciones principales para la capa de pixelado
 */

// Componentes principales
export { PixelateEffectLayer } from './pixelate-effect-layer';
export { PixelateSettings } from './pixelate-settings';

// Esquema y tipos
export { createDefaultPixelateConfig, pixelateConfigSchema } from './pixelate-schema';
export type { PixelateConfig } from './pixelate-schema';

// Acciones del servidor
export { getPixelateConfig, updatePixelateConfig, deletePixelateConfig } from './actions';
