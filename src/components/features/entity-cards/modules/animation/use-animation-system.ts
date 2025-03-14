'use client';

import { useState, useCallback } from 'react';
import { AnimationSystem } from './types';
import { DEFAULT_ANIMATION_SYSTEM } from './animation-module';
import { cn } from '@/lib/utils';

/**
 * Hook personalizado para gestionar el sistema de animación
 */
export function useAnimationSystem(initialSystem?: Partial<AnimationSystem>) {
  // Inicializar el estado con los valores predeterminados combinados con los proporcionados
  const [animationSystem, setAnimationSystem] = useState<AnimationSystem>({
    ...DEFAULT_ANIMATION_SYSTEM,
    ...initialSystem
  });

  /**
   * Actualizar el sistema de animación
   */
  const updateAnimationSystem = useCallback((update: Partial<AnimationSystem>) => {
    setAnimationSystem(prev => ({
      ...prev,
      ...update
    }));
  }, []);

  /**
   * Restablecer el sistema de animación a los valores iniciales
   */
  const resetAnimationSystem = useCallback(() => {
    setAnimationSystem({
      ...DEFAULT_ANIMATION_SYSTEM,
      ...initialSystem
    });
  }, [initialSystem]);

  /**
   * Generar clases CSS basadas en la configuración de animación
   */
  const generateAnimationClasses = useCallback(() => {
    if (!animationSystem.enabled) {
      return '';
    }

    const classes = [];

    // Clases para la duración y función de temporización
    classes.push(`transition-all duration-${animationSystem.transitionDuration}`);

    // Diferentes funciones de temporización
    if (animationSystem.timingFunction === 'ease') {
      classes.push('ease');
    } else if (animationSystem.timingFunction === 'ease-in') {
      classes.push('ease-in');
    } else if (animationSystem.timingFunction === 'ease-out') {
      classes.push('ease-out');
    } else if (animationSystem.timingFunction === 'ease-in-out') {
      classes.push('ease-in-out');
    } else if (animationSystem.timingFunction === 'linear') {
      classes.push('linear');
    } else {
      // Para cubic-bezier personalizados, agregamos un estilo inline
      classes.push('transition-timing-function-custom');
    }

    // Clases para animaciones de entrada
    if (animationSystem.entranceAnimation && animationSystem.entranceAnimation !== 'none') {
      classes.push(`animate-${animationSystem.entranceAnimation}`);

      if (animationSystem.entranceDelay > 0) {
        classes.push(`delay-${animationSystem.entranceDelay}`);
      }
    }

    // Clases para animaciones en bucle
    if (animationSystem.loopAnimations) {
      classes.push('animate-loop');
    }

    return cn(...classes);
  }, [animationSystem]);

  return {
    animationSystem,
    updateAnimationSystem,
    resetAnimationSystem,
    generateAnimationClasses
  };
}