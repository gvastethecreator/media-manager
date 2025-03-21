'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import type { BlendMode, CommonLayerProps } from '../../types';
import { useAnimatedBorder } from '../hooks/use-animated-border';
import type { AnimatedBorderConfig } from './animated-border-settings';

interface AnimatedBorderLayerProps extends CommonLayerProps {
  config: AnimatedBorderConfig;
  isHovered: boolean;
  activeLayer: string;
  isExploded?: boolean;
}

export function AnimatedBorderLayer({
  isHovered,
  activeLayer,
  config,
  isExploded,
}: AnimatedBorderLayerProps) {
  // Determinar si se debe renderizar
  const shouldRender = useMemo(() => {
    return config.enabled && (isHovered || !config.visibleOnHover || (activeLayer === 'animated-border'));
  }, [config.enabled, config.visibleOnHover, isHovered, activeLayer]);

  // Usar el hook de borde animado
  const { canvasRef, error, initializeCanvas } = useAnimatedBorder({
    config,
    shouldRender,
  });

  // Si hay un error o no se debe renderizar, no mostrar nada
  if (error || !shouldRender) {
    return null;
  }

  // Propiedades de animación
  const motionProps = {
    initial: { opacity: 0 },
    animate: { opacity: config.opacity || 1 },
    transition: { duration: 0.3 },
    style: {
      zIndex: config.layerIndex || 1
    },
  };

  // Estilos del canvas
  const canvasStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    mixBlendMode: (config.blendMode || 'normal') as BlendMode,
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  };

  return (
    <motion.div
      className={cn(
        'absolute inset-0 z-0 overflow-hidden',
        isExploded ? 'exploded-layer layer-animated-border' : '',
        activeLayer === 'animated-border' ? 'active-layer z-30' : ''
      )}
      {...motionProps}
      data-layer-id="animated-border"
      data-layer-active={activeLayer === 'animated-border' || null}
    >
      <canvas
        ref={canvasRef}
        style={canvasStyle}
        onLoad={initializeCanvas}
      />
    </motion.div>
  );
}