/**
 * Archivo de tipos unificados para el sistema de tarjetas de entidad
 * 
 * Este archivo centraliza los tipos comunes utilizados por distintos módulos
 * para evitar importaciones circulares y duplicación de tipos.
 */

// Exportación de tipos desde el módulo de efectos
export type { EffectsConfig, VisualEffectsOptions, AdvancedEffectsOptions } from '../modules/effects/types';

// Exportación de tipos desde las configuraciones de tarjetas
export type { CardOptions, DesignSystem, AnimationSystem, ColorPalette } from './unified-card-types';

// Tipos comunes para el estado de debug
export interface DebugState {
  enabledModules: Set<string>;
  effects: Record<string, unknown>;
}

/**
 * Adaptadores para convertir entre distintos formatos de configuración
 */
export interface EntityAdapter<T> {
  fromEntity: (entity: T) => Partial<Record<string, unknown>>;
  toEntity: (options: Partial<Record<string, unknown>>) => Partial<T>;
}

/**
 * Información básica para cualquier entidad
 */
export interface EntityBasicInfo {
  id: string;
  title: string;
  description?: string;
  image?: string;
  metadata?: Record<string, string | number>;
}
