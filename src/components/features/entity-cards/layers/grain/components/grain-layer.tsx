'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGrainStore } from '../actions/grain-config.action';
import { generateGrainPattern } from '../utils/grain-utils';

interface GrainLayerProps {
  className?: string;
  width: number;
  height: number;
  isExploded?: boolean;
  isHovered?: boolean;
  activeLayer?: string | null;
}

export const GrainLayer: React.FC<GrainLayerProps> = ({
  className,
  width,
  height,
  isExploded = false,
  isHovered = false,
  activeLayer = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const { config } = useGrainStore();

  // Generar patrón de grano
  const generatePattern = useCallback(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Generar nuevo patrón
    generateGrainPattern(ctx, {
      width,
      height,
      pattern: config.pattern,
      intensity: config.intensity,
      size: config.size,
      colorMode: config.colorMode,
      roughness: config.roughness,
      distribution: config.distribution,
      fractalNoise: config.fractalNoise,
      seed: config.seed,
      time: timeRef.current,
    });
  }, [config, width, height]);

  // Manejar animación
  useEffect(() => {
    if (!config.enabled || !config.animated) return;

    const animate = (timestamp: number) => {
      timeRef.current = timestamp * 0.001 * config.speed;
      generatePattern();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [config.enabled, config.animated, config.speed, generatePattern]);

  // Generar patrón inicial o cuando cambia la configuración
  useEffect(() => {
    if (!config.enabled || config.animated) return;
    generatePattern();
  }, [config, generatePattern]);

  // Si no está habilitado, no renderizar nada
  if (!config.enabled) return null;

  // Calcular opacidad basada en hover
  const opacity = isHovered ? config.opacity : config.opacity * 0.7;

  return (
    <motion.canvas
      ref={canvasRef}
      className={cn(
        'absolute inset-0 pointer-events-none',
        {
          'mix-blend-normal': config.blend === 'normal',
          'mix-blend-multiply': config.blend === 'multiply',
          'mix-blend-screen': config.blend === 'screen',
          'mix-blend-overlay': config.blend === 'overlay',
          'exploded-layer layer-grain': isExploded,
          'active-layer': activeLayer === 'grain',
        },
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.3 }}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        ...(isExploded ? { zIndex: config.layerIndex } : {}),
      }}
      width={width}
      height={height}
      data-layer-id="grain"
      data-layer-active={activeLayer === 'grain' || null}
    />
  );
};