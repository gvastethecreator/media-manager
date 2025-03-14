'use client';

import { useEffect, useState } from 'react';
import { AnimationModuleProps, AnimationSystem } from './types';
import { AnimationPanel } from './animation-panel';

// Configuración predeterminada para el sistema de animación
export const DEFAULT_ANIMATION_SYSTEM: AnimationSystem = {
  enabled: true,
  hoverEffect: true,
  clickEffect: true,
  reducedMotion: false,
  transitionDuration: 300,
  timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  hoverScale: 1.02,
  hoverRotate: true,
  hoverLift: true,
  liftHeight: 10,
  maxRotation: 15,
  activeScale: 0.98,
  activeBrightness: 0.95,
  entranceAnimation: 'fade-in',
  exitAnimation: 'fade-out',
  entranceDelay: 0,
  loopAnimations: false
};

/**
 * Módulo para gestionar la configuración de animaciones de tarjetas
 */
export function AnimationModule({
  initialAnimationSystem,
  onChange,
  disabled,
  className
}: AnimationModuleProps) {
  // Inicializar el estado del sistema de animación con los valores predeterminados y los proporcionados
  const [animationSystem, setAnimationSystem] = useState<AnimationSystem>({
    ...DEFAULT_ANIMATION_SYSTEM,
    ...initialAnimationSystem
  });

  // Actualizar el estado cuando cambien las props iniciales
  useEffect(() => {
    if (initialAnimationSystem) {
      setAnimationSystem(prevState => ({
        ...prevState,
        ...initialAnimationSystem
      }));
    }
  }, [initialAnimationSystem]);

  // Manejar cambios en el sistema de animación
  const handleAnimationChange = (updatedSystem: AnimationSystem) => {
    setAnimationSystem(updatedSystem);
    onChange?.(updatedSystem);
  };

  return (
    <AnimationPanel
      animationSystem={animationSystem}
      onChange={handleAnimationChange}
      disabled={disabled}
      className={className}
    />
  );
}