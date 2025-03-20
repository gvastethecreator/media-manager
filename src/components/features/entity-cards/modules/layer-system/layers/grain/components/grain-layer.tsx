'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import type { GrainConfig } from '../actions/grain-config.action';
import { generateGrainPattern } from '../utils/grain-utils';

/**
 * 🌾 Componente interno de grano
 */
const GrainLayerComponent = ({
  processedConfig,
  style,
  isVisible,
}: {
  processedConfig: GrainConfig;
  style: React.CSSProperties;
  isVisible: boolean;
}) => {
  // Referencias y estado
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // 🎨 Generar el patrón de grano
  const renderGrain = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;

    generateGrainPattern({
      width: canvas.width,
      height: canvas.height,
      intensity: processedConfig.intensity,
      size: processedConfig.size,
      animated: processedConfig.animated,
      speed: processedConfig.speed,
      colorMode: processedConfig.colorMode,
      pattern: processedConfig.pattern,
      fractalNoise: processedConfig.fractalNoise,
      roughness: processedConfig.roughness,
      distribution: processedConfig.distribution,
      seed: processedConfig.seed,
      time: Date.now(),
    });

    if (processedConfig.animated) {
      animationFrameRef.current = requestAnimationFrame(renderGrain);
    }
  }, [processedConfig, isVisible]);

  // 🔄 Inicializar y limpiar animación
  useEffect(() => {
    if (isVisible) {
      renderGrain();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, renderGrain]);

  // 📏 Manejar redimensionamiento
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      renderGrain();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    const canvas = canvasRef.current;

    if (canvas) {
      resizeObserver.observe(canvas);
    }

    return () => {
      if (canvas) {
        resizeObserver.unobserve(canvas);
      }
      resizeObserver.disconnect();
    };
  }, [renderGrain]);

  // 🎨 Calcular los estilos del canvas
  const canvasStyle = useMemo(() => ({
    ...style,
    mixBlendMode: processedConfig.blend as React.CSSProperties['mixBlendMode'],
    opacity: processedConfig.opacity,
  }), [processedConfig.blend, processedConfig.opacity, style]);

  return (
    <motion.canvas
      ref={canvasRef}
      style={canvasStyle}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    />
  );
};

/**
 * 🌾 Capa de grano con funcionalidad base
 */
export const GrainLayer = withBaseLayer<GrainConfig>(GrainLayerComponent);