/**
 * 🌈 Sistema de capas para Entity Cards
 *
 * Este módulo proporciona un sistema completo para gestionar capas visuales en las tarjetas de entidad,
 * ofreciendo una arquitectura extensible basada en plugins.
 */

// Exportar componentes principales del sistema de plugins
export {
	LayerPluginProvider,
	useLayerPlugin,
	LayerRenderer
} from './layer-plugin-system';

// Exportar tipos para capas
export type {
	LayerConfig,
	LayerImplementation,
	LayerRenderProps,
	LayerSettingsProps,
	LayerSystemConfig
} from './types';

// Exportar registradores de capas
export { RegisterLayers } from './register-layers';
export { RegisterLayersV2, RegisterLayersV2ByEntityType } from './register-layers-v2';

// Exportar componentes de UI para capas
export { LayerSelector } from './layer-selector';
export { LayerConfigEditor } from './layer-config-editor';
export { LayersPanel } from './layers-panel';
export { layerBaseConfigSchema } from './layer-config-base';
export { CardContainer } from './card-container';

// Exportar capas individuales
export { borderLayerImplementation } from './border/border-layer-implementation';
export { glowLayerImplementation } from './glow/glow-layer-implementation';
export { scanlinesLayerImplementation } from './scanlines';
export { textureLayerImplementation } from './textures';

// Exportar integraciones con el módulo de capas
export {
	adaptLayerSystemToEntityCard,
	adaptEntityCardToLayerSystem
} from '../modules/layers-module/entity-card-layer-adapter';

export {
	LayersProvider,
	useLayers,
	adaptCardOptionsToLayersConfig
} from '../modules/layers-module/use-layers';

// Exportar registradores de capas del módulo
export {
	RegisterAllLayers,
	RegisterLayers as RegisterLayersByEntityType
} from '../modules/layers-module/register-layers';

// Exportar tipos
export type {
	BaseLayerConfig,
	LayerComponent,
	LayerComponentProps,
	LegacyLayerComponentProps
} from './layer-plugin-system';

export type {
	CommonLayerProps,
	ExplodeLayerTransformFunction,
	LayerChangeEvent,
	LayerInfo,
	LayerServerActions,
	LayersGlobalOptions,
	LayersSettingsPanelProps,
	LayersSystemResult,
	LayersSystemState
} from './types';

// Exportar componentes específicos
export { CardBackside } from './card-backside';
export { CardBorder } from './card-border';
export { CardContent } from './card-content';
export { CardDescription } from './card-description';
export { CardExplode } from './card-explode';
export { CardFooter } from './card-footer';
export { CardGlow } from './card-glow';
export { CardGrain } from './card-grain';
export { CardHeader } from './card-header';
export { CardHolographic } from './card-holographic';
export { CardImage } from './card-image';
export { CardMetadata } from './card-metadata';
export { CardScanlines } from './card-scanlines';
export { CardStats } from './card-stats';
export { CardTexture } from './card-texture';

// Exportar plantillas para nuevas capas
export * from './templates';
