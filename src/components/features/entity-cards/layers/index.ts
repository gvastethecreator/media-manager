'use client';

/**
 * 🌈 Sistema de capas para Entity Cards
 *
 * Este módulo proporciona un sistema completo para gestionar capas visuales en las tarjetas de entidad,
 * ofreciendo una arquitectura extensible basada en plugins.
 */

/**
 * 🧩 Exportaciones del sistema de capas
 *
 * Este archivo centraliza las exportaciones del sistema de capas,
 * para simplificar las importaciones en otros archivos.
 */

// Tipos básicos
export * from './types';

// Core del sistema de capas
export {
    LayerPluginProvider, LayerRenderer, useLayerPlugin, type BaseLayerConfig, type LayerComponent,
    type LayerComponentProps,
    type LayerSettingsProps, type LegacyLayerComponentProps
} from './layer-plugin-system';

// Componentes de registro de capas
export { RegisterAllLayers, RegisterLayersByEntityType } from './register-all-layers';
export { RegisterLayers } from './register-layers';
export { RegisterAllLayers as RegisterLayersV2, RegisterLayersByEntityType as RegisterLayersV2ByEntityType };

// Para mantener compatibilidad con código existente que use las versiones V2
import { RegisterAllLayers, RegisterLayersByEntityType } from './register-all-layers';

// Utilidades de capa
    export { CardExplode } from './card-explode';
    export { LayerSelector } from './layer-selector';

// Componentes de capa específicos para entidades
export { CardBorder } from './card-border';
export { CardContent } from './card-content';
export { CardGlow } from './card-glow';
export { CardScanlines } from './card-scanlines';

// Re-exportar capas individuales para acceso directo
export * from './border';
export * from './chromatic-aberration';
export * from './glow';
export * from './scanlines';
export * from './textures';

// Re-exportar módulos relacionados con capas desde layers-module
export {
    LayersProvider,
    useLayers
} from '../modules/layers-module/use-layers';

export {
    LayersPanel
} from './layers-panel';

export {
    LayersConfigPanel
} from './layers-config-panel';

export {
    LayerConfigEditor
} from './layer-config-editor';

// Adaptadores entre formatos de capa
export {
    adaptEntityCardToLayerSystem,
    adaptLayerSystemToEntityCard
} from '../modules/layers-module/entity-card-layer-adapter';

export {
    adaptCardOptionsToLayersConfig
} from '../modules/layers-module/use-layers';

