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
export { default as CardBackside } from './backside';
export { default as CardBorder } from './border';
export { default as CardContainer } from './container';
export { default as CardContent } from './content';
export { default as CardDescription } from './description';
export { default as CardExplode } from './explode';
export { default as CardFooter } from './footer';
export { default as CardGlow } from './glow';
export { default as CardGrain } from './grain';
export { default as CardHeader } from './header';
export { default as CardHolographic } from './holographic';
export { default as CardImage } from './image';
export { default as CardMetadata } from './metadata';
export { default as CardScanlines } from './scanlines';
export { default as CardStats } from './stats';
export { default as CardTexture } from './texture';

// Exportar plantillas para nuevas capas
export * from './templates';
