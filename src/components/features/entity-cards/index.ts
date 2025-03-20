/**
 * 🎴 Sistema de Entity Cards - Versión Simplificada
 *
 * Este archivo proporciona un punto de entrada centralizado para los componentes
 * básicos del sistema de tarjetas de entidades.
 */

// Componentes principales
export { EntityCard } from './entity-card';
export { EntityCardAdapter } from './entity-card-adapter';

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

