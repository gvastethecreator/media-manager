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

/**
 * Módulos de capas para entidades
 *
 * Este archivo exporta todos los módulos de capas disponibles para el sistema de tarjetas.
 * Cada capa proporciona diferentes efectos visuales que se pueden aplicar a las tarjetas.
 */

'use client';

// Importaciones necesarias
import * as React from 'react';
import { RegisterLayers } from './register-layers';

// Tipos básicos
export * from './types';

// Core del sistema de capas
export { LayerPluginProvider, SingleLayerRenderer, useLayerPlugin } from './layer-plugin-system';

// Componentes de registro de capas
// Exportar RegisterLayers disponible, otros serán implementados posteriormente
export { RegisterLayers } from './register-layers';

// Componentes de integración con EntityCard
export {
	EntityCardLayers,
	EntityCardLayersProvider,
	LayerRenderer,
} from './entity-card-layers';

// Componentes de utilidad y configuración
export { LayerConfigEditor } from './layer-config-editor';
export { LayerSelector } from './layer-selector';
export { LayersConfigPanel } from './layers-config-panel';
export { LayersPanel } from './layers-panel';

// Exportar todas las capas individuales
export * from './animated-border';
export * from './blur';
export * from './border';
export * from './glitch';
export * from './glow';
export * from './grain';
export * from './image';
export * from './patterns';
export { scanlinesImplementation } from './scanlines';
export { textureImplementation } from './textures';

// Crear un RegisterAllLayers provisional hasta que se implemente completamente
export function RegisterAllLayers(): React.ReactElement {
	return React.createElement(RegisterLayers);
}

// Alias para registro de capas por tipo de entidad
export function RegisterLayersByEntityType(): React.ReactElement {
	return React.createElement(RegisterLayers);
}

// Estos módulos serán implementados en futuras iteraciones:
// - LayersProvider y useLayers de '../use-layers'
// - adaptEntityCardToLayerSystem y adaptLayerSystemToEntityCard de '../entity-card-layer-adapter'
// - adaptCardOptionsToLayersConfig de '../use-layers'
