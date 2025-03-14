'use client';

import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_STATES_SYSTEM } from './states-module';
import type { StatesSystem } from './types';

/**
 * Props para el hook useStatesSystem
 */
interface UseStatesSystemProps {
  /** Estado inicial del sistema de estados */
  initialStates?: Partial<StatesSystem>;
}

/**
 * Resultado del hook useStatesSystem
 */
interface UseStatesSystemResult {
  /** Sistema de estados actual */
  statesSystem: StatesSystem;

  /** Actualiza el sistema de estados completo */
  setStatesSystem: (states: StatesSystem) => void;

  /** Actualiza un estado específico */
  updateState: <K extends keyof StatesSystem>(stateName: K, stateConfig: StatesSystem[K]) => void;

  /** Habilita o deshabilita un estado */
  toggleState: (stateName: keyof StatesSystem, enabled: boolean) => void;

  /** Restablece todos los estados a los valores predeterminados */
  resetAllStates: () => void;

  /** Restablece un estado específico a su valor predeterminado */
  resetState: (stateName: keyof StatesSystem) => void;

  /** Comprueba si un estado está habilitado */
  isStateEnabled: (stateName: keyof StatesSystem) => boolean;

  /** Genera clases CSS para los estados */
  generateStateClasses: (interactiveMode?: string) => string;
}

/**
 * Hook para gestionar el sistema de estados interactivos
 * @param props Props del hook
 * @returns Funciones y valores para gestionar estados
 */
export function useStatesSystem(props?: UseStatesSystemProps): UseStatesSystemResult {
  const initialStates = props?.initialStates || {};

  // Estado para almacenar la configuración de estados
  const [statesSystem, setStatesSystem] = useState<StatesSystem>({
    ...DEFAULT_STATES_SYSTEM,
    ...initialStates,
  });

  // Actualiza un estado específico
  const updateState = useCallback(
    <K extends keyof StatesSystem>(stateName: K, stateConfig: StatesSystem[K]) => {
      setStatesSystem((prev) => ({
        ...prev,
        [stateName]: {
          ...prev[stateName],
          ...stateConfig,
        },
      }));
    },
    []
  );

  // Habilita o deshabilita un estado
  const toggleState = useCallback(
    (stateName: keyof StatesSystem, enabled: boolean) => {
      if (enabled) {
        // Habilitar con valores predeterminados
        setStatesSystem((prev) => ({
          ...prev,
          [stateName]: DEFAULT_STATES_SYSTEM[stateName],
        }));
      } else {
        // Deshabilitar
        setStatesSystem((prev) => {
          const newState = { ...prev };
          delete newState[stateName];
          return newState;
        });
      }
    },
    []
  );

  // Restablece todos los estados a los valores predeterminados
  const resetAllStates = useCallback(() => {
    setStatesSystem(DEFAULT_STATES_SYSTEM);
  }, []);

  // Restablece un estado específico a su valor predeterminado
  const resetState = useCallback((stateName: keyof StatesSystem) => {
    if (DEFAULT_STATES_SYSTEM[stateName]) {
      setStatesSystem((prev) => ({
        ...prev,
        [stateName]: DEFAULT_STATES_SYSTEM[stateName],
      }));
    }
  }, []);

  // Verifica si un estado está habilitado
  const isStateEnabled = useCallback(
    (stateName: keyof StatesSystem) => !!statesSystem[stateName],
    [statesSystem]
  );

  // Genera clases CSS para los estados
  const generateStateClasses = useCallback(
    (interactiveMode?: string) => {
      const classes: string[] = [];

      // Solo añadir clases de hover si el modo interactivo lo permite
      if (statesSystem.hover && interactiveMode !== 'none') {
        classes.push('states-hover');
        if (statesSystem.hover.rotate) {
          classes.push('hover-rotate');
        }
        if (statesSystem.hover.lift) {
          classes.push('hover-lift');
        }
      }

      if (statesSystem.focus) {
        classes.push('states-focus');
        if (statesSystem.focus.rotate) {
          classes.push('focus-rotate');
        }
        if (statesSystem.focus.lift) {
          classes.push('focus-lift');
        }
      }

      if (statesSystem.active) {
        classes.push('states-active');
      }

      if (statesSystem.disabled) {
        classes.push('states-disabled');
        if (statesSystem.disabled.grayscale) {
          classes.push('disabled-grayscale');
        }
      }

      if (statesSystem.selected) {
        classes.push('states-selected');
        if (statesSystem.selected.rotate) {
          classes.push('selected-rotate');
        }
        if (statesSystem.selected.lift) {
          classes.push('selected-lift');
        }
      }

      return classes.join(' ');
    },
    [statesSystem]
  );

  return {
    statesSystem,
    setStatesSystem,
    updateState,
    toggleState,
    resetAllStates,
    resetState,
    isStateEnabled,
    generateStateClasses,
  };
}