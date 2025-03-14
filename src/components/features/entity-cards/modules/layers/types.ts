/**
 * 🌈 Tipos para el módulo de capas
 */
import type { SettingsPanelProps } from '../../types';

/**
 * Props para el panel de configuración de capas
 */
export interface LayersSettingsPanelProps extends SettingsPanelProps {
  /**
   * Tipo de entidad para la que se están configurando las capas
   */
  entityType: string;

  /**
   * ID opcional de la entidad para la que se están configurando las capas
   */
  entityId?: string;
}

/**
 * Configuración para una capa específica
 */
export interface LayerConfig {
  /**
   * Indica si la capa está habilitada
   */
  enabled: boolean;

  /**
   * Índice de la capa que determina su posición de renderizado
   */
  layerIndex: number;

  /**
   * Propiedades adicionales específicas de cada tipo de capa
   */
  [key: string]: unknown;
}

/**
 * Configuración del sistema de capas
 */
export interface LayerSystemConfig {
  /**
   * Determina si las capas están habilitadas globalmente
   */
  enabled: boolean;

  /**
   * Configuración de estrategia de renderizado de capas
   */
  renderStrategy: 'stacked' | 'composited' | 'dynamic';

  /**
   * Modo de composición para capas superpuestas
   */
  compositionMode: 'normal' | 'overlay' | 'screen' | 'multiply';

  /**
   * Opciones adicionales para el sistema de capas
   */
  options?: Record<string, unknown>;
}