/**
 * 🌈 Sistema de capas para Entity Cards
 *
 * Este módulo proporciona un sistema completo para gestionar capas visuales en las tarjetas de entidad,
 * ofreciendo una arquitectura extensible basada en plugins.
 */

// Exportar componentes principales
export { LayerPluginProvider, useLayerPlugin, LayerRenderer } from './layer-plugin-system';
export { RegisterLayers, RegisterAllLayers, RegisterEntityTypeLayers } from '../modules/layers/register-layers';
export { LayersPanel } from './layers-panel';
export { LayersConfigPanel } from './layers-config-panel';
export { LayerConfigEditor } from './layer-config-editor';
export { LayerDemo } from './layer-demo';

// Exportar tipos
export type {
  BaseLayerConfig,
  LayerComponent,
  LayerComponentProps,
  LayerSettingsProps,
  LegacyLayerComponentProps
} from './layer-plugin-system';

export type {
  LayerConfig,
  LayerSystemConfig,
  LayersGlobalOptions,
  LayerInfo,
  LayersSystemState,
  LayerChangeEvent,
  LayersSystemResult,
  CommonLayerProps,
  ExplodeLayerTransformFunction,
  LayersSettingsPanelProps,
  LayerServerActions
} from './types';

// Exportar capas individuales
export { borderLayer } from './border';
export { glowLayer } from './glow';
export { grainLayer } from './grain';
export { holographicLayer } from './holographic';
export { scanlinesLayer } from './scanlines';
export { textureLayer } from './textures';
export { animatedBorderLayer } from './animated-border';
export { chromaticAberrationLayer } from './chromatic-aberration';
export { glitchLayer } from './glitch';
export { noiseTextureLayer } from './noise-texture';
export { filterLayer } from './filters';
export { patternLayer } from './patterns';
export { pixelateLayer } from './pixelate';
export { shaderLayer } from './shaders';

// Exportar componentes de capa
export { CardBackside } from './card-backside';
export { CardBorder } from './card-border';
export { CardContainer } from './card-container';
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
