import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScanlinesConfig } from '../actions/scanlines-config.action';

interface UseScanlinesProps {
  config: ScanlinesConfig;
  shouldRender: boolean;
}

interface UseScanlinesReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  error: string | null;
  initializeCanvas: () => void;
  renderScanlines: () => void;
}

/**
 * 📺 Hook para manejar la lógica de las líneas de escaneo
 * @param config - Configuración de las líneas de escaneo
 * @param shouldRender - Indica si se debe renderizar el efecto
 */
export const useScanlines = ({ config, shouldRender }: UseScanlinesProps): UseScanlinesReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // 🎨 Memoriza las configuraciones del contexto
  const contextConfig = useMemo(() => ({
    opacity: config.opacity ?? 1,
    lineWidth: config.lineWidth ?? 1,
    lineSpacing: config.lineSpacing ?? 2,
    speed: config.speed ?? 0,
    color: config.color ?? 'rgba(0, 0, 0, 0.1)',
    blendMode: config.blendMode ?? 'multiply',
    direction: config.direction ?? 'horizontal',
    animated: config.animated ?? false,
    offset: config.offset ?? 0,
  }), [config]);

  // 🎨 Inicializa el canvas y configura el contexto
  const initializeCanvas = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('No se pudo acceder al canvas');
      }

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto 2D');
      }

      // Ajustar el tamaño del canvas al DPR
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      // Solo actualizar si las dimensiones han cambiado
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      contextRef.current = ctx;
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al inicializar el canvas');
    }
  }, []);

  // 🎨 Renderiza las líneas de escaneo
  const renderScanlines = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;

    if (!canvas || !ctx) {
      setError('Contexto no inicializado');
      return;
    }

    try {
      const {
        opacity,
        lineWidth,
        lineSpacing,
        speed,
        color,
        blendMode,
        direction,
        animated,
        offset,
      } = contextConfig;

      // Limpiar el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Configurar el contexto
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      // Calcular el desplazamiento animado
      const timestamp = Date.now() * (speed * 0.001);
      const animatedOffset = animated ? (timestamp % (lineSpacing * 2)) : 0;
      const totalOffset = offset + animatedOffset;

      // Dibujar las líneas
      ctx.beginPath();
      if (direction === 'horizontal') {
        for (let y = totalOffset - lineSpacing; y < canvas.height + lineSpacing; y += lineSpacing) {
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
        }
      } else {
        for (let x = totalOffset - lineSpacing; x < canvas.width + lineSpacing; x += lineSpacing) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
        }
      }
      ctx.stroke();

      // Programar el siguiente frame si está animado
      if (animated && shouldRender) {
        animationFrameRef.current = requestAnimationFrame(renderScanlines);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al renderizar las líneas');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [contextConfig, shouldRender]);

  // 🔄 Efecto para manejar la animación
  useEffect(() => {
    if (shouldRender) {
      renderScanlines();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [shouldRender, renderScanlines]);

  // 📏 Efecto para manejar el redimensionamiento
  useEffect(() => {
    const handleResize = () => {
      initializeCanvas();
      if (shouldRender) {
        renderScanlines();
      }
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
  }, [initializeCanvas, renderScanlines, shouldRender]);

  return {
    canvasRef,
    error,
    initializeCanvas,
    renderScanlines,
  };
};
