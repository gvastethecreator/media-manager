import { useCallback, useState } from 'react';
import type { BaseEffectOptions } from './types';

/**
 * 🎨 Hook para manejar estados y cambios de efectos
 */
export function useEffectState<T extends BaseEffectOptions>(
  initialEffect: T,
  onChange?: (effect: T) => void
) {
  const [effect, setEffect] = useState<T>(initialEffect);

  const handleEffectChange = useCallback(
    (changes: Partial<T>) => {
      const updatedEffect = {
        ...effect,
        ...changes,
      };
      setEffect(updatedEffect);
      onChange?.(updatedEffect);
    },
    [effect, onChange]
  );

  const resetEffect = useCallback(() => {
    setEffect(initialEffect);
    onChange?.(initialEffect);
  }, [initialEffect, onChange]);

  return {
    effect,
    setEffect,
    handleEffectChange,
    resetEffect,
  };
}

/**
 * 🎛️ Hook para manejar múltiples efectos
 */
export function useEffectsManager<T extends Record<string, BaseEffectOptions>>(
  initialEffects: T,
  onChange?: (effects: T) => void
) {
  const [effects, setEffects] = useState<T>(initialEffects);

  const handleEffectChange = useCallback(
    <K extends keyof T>(effectKey: K, changes: Partial<T[K]>) => {
      const updatedEffects = {
        ...effects,
        [effectKey]: {
          ...effects[effectKey],
          ...changes,
        },
      };
      setEffects(updatedEffects);
      onChange?.(updatedEffects);
    },
    [effects, onChange]
  );

  const resetEffects = useCallback(() => {
    setEffects(initialEffects);
    onChange?.(initialEffects);
  }, [initialEffects, onChange]);

  return {
    effects,
    setEffects,
    handleEffectChange,
    resetEffects,
  };
}

/**
 * 🔄 Hook para sincronizar efectos con configuración externa
 */
export function useSyncedEffects<T extends Record<string, BaseEffectOptions>>(
  externalConfig: T,
  onChange: (config: T) => void
) {
  const {
    effects,
    handleEffectChange,
    resetEffects,
  } = useEffectsManager(externalConfig, onChange);

  const updateEffectConfig = useCallback(
    (effectKey: keyof T, value: Partial<T[keyof T]>) => {
      handleEffectChange(effectKey, value);
    },
    [handleEffectChange]
  );

  return {
    effects,
    updateEffectConfig,
    resetEffects,
  };
}
