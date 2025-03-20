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
    LayerRenderer as BaseLayerRenderer, LayerPluginProvider, useLayerPlugin
} from './layer-plugin-system';

// Componentes de registro de capas
export { RegisterAllLayers, RegisterLayersByEntityType } from './register-all-layers';
export { RegisterLayers } from './register-layers';

// Componentes de integración con EntityCard
export {
    EntityCardLayers,
    EntityCardLayersProvider,
    LayerRenderer
} from './entity-card-layers';

// Componentes de utilidad y configuración
export { LayerConfigEditor } from './layer-config-editor';
export { LayerSelector } from './layer-selector';
export { LayersConfigPanel } from './layers-config-panel';
export { LayersPanel } from './layers-panel';

// Componentes de capa específicos
export * from './border';
export * from './chromatic-aberration';
export * from './content';
export * from './glow';
export * from './image';
export * from './metadata';
export * from './scanlines';
export * from './textures';

// Re-exportar módulos relacionados con capas desde layers-module si están disponibles
try {
    // Importaciones opcionales que pueden no estar disponibles aún
    export {
        LayersProvider,
        useLayers
    } from '../use-layers';

    export {
        adaptEntityCardToLayerSystem,
        adaptLayerSystemToEntityCard
    } from '../entity-card-layer-adapter';

    export {
        adaptCardOptionsToLayersConfig
    } from '../use-layers';
} catch (error) {
    // Estos módulos pueden no estar disponibles todavía,
    // se implementarán en futuras iteraciones
}

