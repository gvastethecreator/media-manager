'use client';

import { useState, useCallback, useMemo, createContext, useContext } from 'react';
import type { EntityType } from '@/types/entities/entities';
import { DEFAULT_SYSTEM_CONFIG, type SystemConfig, type SystemContextType } from './types';
import { deepMerge } from '@/lib/utils';

/**
 * 🧩 Contexto para el sistema de Entity Cards
 */
const SystemContext = createContext<SystemContextType | null>(null);

/**
 * 🧩 Proveedor del contexto del sistema
 */
export function SystemProvider({
  children,
  initialConfig = {}
}: {
  children: React.ReactNode;
  initialConfig?: Partial<SystemConfig>;
}) {
  const [config, setConfig] = useState<SystemConfig>(() =>
    deepMerge(DEFAULT_SYSTEM_CONFIG, initialConfig) as SystemConfig
  );

  const updateConfig = useCallback((newConfig: Partial<SystemConfig>) => {
    setConfig(prevConfig => deepMerge(prevConfig, newConfig) as SystemConfig);
  }, []);

  // Funciones para obtener configuraciones específicas para entidades
  const getRarityForEntity = useCallback((entityId: string, entityType: EntityType): string => {
    // Aquí se implementaría la lógica para obtener la rareza de una entidad específica
    // Por ahora, devolvemos la rareza por defecto
    return config.rarity.defaultRarity;
  }, [config.rarity.defaultRarity]);

  const getTextureForEntity = useCallback((entityId: string, entityType: EntityType): string => {
    // Aquí se implementaría la lógica para obtener la textura de una entidad específica
    // Por ahora, devolvemos la textura por defecto
    return config.texture.defaultTexture;
  }, [config.texture.defaultTexture]);

  const getCategoryForEntity = useCallback((entityId: string, entityType: EntityType): string => {
    // Aquí se implementaría la lógica para obtener la categoría de una entidad específica
    // Por ahora, devolvemos la categoría por defecto
    return config.category.defaultCategory;
  }, [config.category.defaultCategory]);

  const value = useMemo(() => ({
    config,
    updateConfig,
    getRarityForEntity,
    getTextureForEntity,
    getCategoryForEntity
  }), [
    config,
    updateConfig,
    getRarityForEntity,
    getTextureForEntity,
    getCategoryForEntity
  ]);

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}

/**
 * 🧩 Hook para usar el sistema de Entity Cards
 */
export function useSystem() {
  const context = useContext(SystemContext);

  if (!context) {
    throw new Error('useSystem debe ser usado dentro de un SystemProvider');
  }

  return context;
}

/**
 * 🧩 Hook para usar el sistema de rareza
 */
export function useRaritySystem() {
  const { config, updateConfig, getRarityForEntity } = useSystem();

  const updateRarityConfig = useCallback((newConfig: Partial<SystemConfig['rarity']>) => {
    updateConfig({ rarity: newConfig });
  }, [updateConfig]);

  return {
    rarityConfig: config.rarity,
    updateRarityConfig,
    getRarityForEntity
  };
}

/**
 * 🧩 Hook para usar el sistema de texturas
 */
export function useTextureSystem() {
  const { config, updateConfig, getTextureForEntity } = useSystem();

  const updateTextureConfig = useCallback((newConfig: Partial<SystemConfig['texture']>) => {
    updateConfig({ texture: newConfig });
  }, [updateConfig]);

  return {
    textureConfig: config.texture,
    updateTextureConfig,
    getTextureForEntity
  };
}

/**
 * 🧩 Hook para usar el sistema de categorías
 */
export function useCategorySystem() {
  const { config, updateConfig, getCategoryForEntity } = useSystem();

  const updateCategoryConfig = useCallback((newConfig: Partial<SystemConfig['category']>) => {
    updateConfig({ category: newConfig });
  }, [updateConfig]);

  return {
    categoryConfig: config.category,
    updateCategoryConfig,
    getCategoryForEntity
  };
}