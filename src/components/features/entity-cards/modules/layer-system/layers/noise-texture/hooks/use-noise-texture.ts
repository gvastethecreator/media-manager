'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NoiseTextureConfig } from '../actions/noise-texture-config.action';
import { noiseCache, noiseMapToImageData } from '../utils/noise-algorithms';

interface UseNoiseTextureProps {
  config: NoiseTextureConfig;
  shouldRender: boolean;
}

interface UseNoiseTextureResult {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  error: string | null;
  initializeCanvas: () => boolean;
  renderNoise: (time?: number) => void;
}

/**
 * Hook personalizado para manejar la lógica de la capa de ruido
 * @param config - Configuración de la textura de ruido
 * @param shouldRender - Indica si la capa debe renderizarse
 */
export function useNoiseTexture({ config, shouldRender }: UseNoiseTextureProps): UseNoiseTextureResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationRef = useRef<number>();
  const [error, setError] = useState<string | null>(null);

  const {
    opacity = 0.1,
    density = 0.6,
    pattern = 'fractalNoise',
    scale = 1,
    octaves = 3,
    seed = 42,
    animated = false,
    animationSpeed = 1,
    color = 'rgba(255, 255, 255, 0.5)',
    intensity = 0.5,
    blendMode = 'overlay',
  } = config;

  // Inicializar contexto del canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) {
      setError('Canvas no disponible');
      return false;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      setError('Contexto 2D no disponible');
      return false;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvasRef.current.getBoundingClientRect();

    canvasRef.current.width = rect.width * dpr;
    canvasRef.current.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    contextRef.current = ctx;
    return true;
  }, []);

  // Renderizar el ruido
  const renderNoise = useCallback((time = 0) => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;

    if (!ctx || !canvas) {
      setError('Contexto o canvas no disponible');
      return;
    }

    try {
      // Tamaño optimizado del mapa de ruido
      const mapWidth = Math.ceil(canvas.width / 4);
      const mapHeight = Math.ceil(canvas.height / 4);

      // Semilla animada si está activado
      const animatedSeed = animated ? seed + time * animationSpeed * 0.001 : seed;

      // Generar o recuperar mapa de ruido
      const noiseMap = noiseCache.get(mapWidth, mapHeight, pattern as 'perlin' | 'simplex' | 'fractalNoise', {
        seed: animatedSeed,
        scale,
        octaves,
        persistence: density,
      });

      // Convertir a ImageData y renderizar
      const imageData = noiseMapToImageData(noiseMap, color, intensity);
      createImageBitmap(imageData)
        .then((bitmap) => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = opacity;
          ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
          ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, canvas.width, canvas.height);
          bitmap.close();

          if (animated) {
            animationRef.current = requestAnimationFrame(renderNoise);
          }
        })
        .catch((err) => {
          setError(`Error al crear bitmap: ${err.message}`);
        });
    } catch (err) {
      setError(`Error al generar ruido: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  }, [animated, animationSpeed, blendMode, color, density, intensity, opacity, pattern, scale, octaves, seed]);

  // Efecto principal de renderizado
  useEffect(() => {
    if (!shouldRender) return;

    const success = initializeCanvas();
    if (!success) return;

    if (animated) {
      animationRef.current = requestAnimationFrame(renderNoise);
    } else {
      renderNoise();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldRender, initializeCanvas, renderNoise, animated]);

  // Manejar redimensionamiento
  useEffect(() => {
    const handleResize = () => {
      const success = initializeCanvas();
      if (success) {
        renderNoise();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeCanvas, renderNoise]);

  return {
    canvasRef,
    error,
    initializeCanvas,
    renderNoise,
  };
}