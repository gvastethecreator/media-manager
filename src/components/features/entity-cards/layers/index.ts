/**
 * Sistema de Capas para Entity Cards
 * @module EntityCards/Layers
 */

// Exportar el sistema principal de plugins
export { LayerPluginProvider, LayerRenderer, useLayerPlugin } from './layer-plugin-system';
export type { BaseLayerConfig, LayerComponent, LayerComponentProps, LayerSettingsProps } from './layer-plugin-system';

// Exportar tipos
export * from './types';

// Exportar hooks
export { useLayersSystem } from './hooks/layers-system';

// Exportar componentes principales
export { LayerConfigEditor } from './layer-config-editor';
export { LayerDemo } from './layer-demo';
export { LayersConfigPanel } from './layers-config-panel';
export { LayersPanel } from './layers-panel';
export { RegisterLayers } from './register-layers';

// Exportar capas individuales
export * from './animated-border';
export * from './border';
export * from './chromatic-aberration';
export * from './filters';
export * from './glitch';
export * from './glow';
export * from './grain';
export * from './holographic';
export * from './noise-texture';
export * from './patterns';
export * from './pixelate';
export * from './scanlines';
export * from './shaders';
export * from './textures';

// Exportar componentes auxiliares
export { default as CardBackside } from './card-backside';
export { default as CardBorder } from './card-border';
export { default as CardContainer } from './card-container';
export { default as CardContent } from './card-content';
export { default as CardDescription } from './card-description';
export { default as CardExplode } from './card-explode';
export { default as CardFooter } from './card-footer';
export { default as CardGlow } from './card-glow';
export { default as CardGrain } from './card-grain';
export { default as CardHeader } from './card-header';
export { default as CardHolographic } from './card-holographic';
export { default as CardImage } from './card-image';
export { default as CardMetadata } from './card-metadata';
export { default as CardScanlines } from './card-scanlines';
export { default as CardStats } from './card-stats';
export { default as CardTexture } from './card-texture';

// Exportar plantillas para nuevas capas
export * from './templates';
