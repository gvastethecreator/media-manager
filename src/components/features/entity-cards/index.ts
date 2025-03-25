'use client';

/**
 * 🎴 Sistema de Entity Cards
 *
 * Este módulo proporciona componentes para renderizar y gestionar tarjetas de entidades
 * con soporte para capas visuales y efectos.
 */

// Componente principal y versión de desarrollo
export { EntityCard } from './entity-card';
export { EntityCardDev } from './entity-card-dev';
export { EntityCardAdapter } from './entity-card-adapter';

// Tipos
export type { EntityCardProps } from './entity-card';
export type { EntityCardDevProps } from './entity-card-dev';
export type { EntityBasicInfo } from './types/unified-types';

// Sistema de capas
export {
	EntityCardLayers,
	EntityCardLayersProvider,
	LayerRenderer,
	RegisterAllLayers,
	RegisterLayersByEntityType
} from './modules/layers';

// Tipos de capas
export type {
	CommonLayerProps,
	LayerImplementation
} from './modules/layers/types';
export type { BaseLayerConfig } from './modules/layers/layer-config-base';

// Contextos y Providers
export { CardDisplayProvider, useCardDisplay } from './context/card-display-context';

// Re-exportar tipos principales
export type { CardOptions } from './types/unified-card-types';

// Re-exportamos algunas exportaciones originales para mantener compatibilidad
export { EntityCardWrapper } from './entity-card-wrapper';

// Mensaje informativo
if (process.env.NODE_ENV === 'development') {
	console.info('🔄 Sistema de tarjetas de entidad - Versión simplificada');
}

