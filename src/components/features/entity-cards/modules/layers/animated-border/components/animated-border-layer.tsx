'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import type { CommonLayerProps } from '../../../types/card-layer-types';
import type { AnimatedBorderConfig } from '../actions/animated-border-config.action';
import { useAnimatedBorder } from '../hooks/use-animated-border';

interface AnimatedBorderLayerProps extends CommonLayerProps {
  config: AnimatedBorderConfig;
}

export function AnimatedBorderLayer({
  isExploded,
  isHovered,
  activeLayer,
  getExplodeLayerTransform,
  config,
}: AnimatedBorderLayerProps) {
  // Determinar si se debe renderizar
  const shouldRender = useMemo(() => {
    return config.enabled && (isHovered || !config.visibleOnHover || (activeLayer === 'animated-border' && isExploded));
  }, [config.enabled, config.visibleOnHover, isHovered, activeLayer, isExploded]);

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
      ...getExplodeLayerTransform(config.layerIndex || 1),
      ...(isExploded ? { zIndex: config.layerIndex || 1 } : {}),
    },
  };

  // Estilos del canvas
  const canvasStyle = {
    width: '100%',
    height: '100%',
    mixBlendMode: config.blendMode || 'normal',
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  } as const;

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