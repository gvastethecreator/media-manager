import { useCallback, useEffect, useRef, useState } from 'react';
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

export const useScanlines = ({ config, shouldRender }: UseScanlinesProps): UseScanlinesReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();

  // 🎨 Inicializa el canvas y configura el contexto
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('No se pudo acceder al canvas');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('No se pudo obtener el contexto 2D');
      return;
    }

    // Ajustar el tamaño del canvas al DPR
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Limpiar errores previos
    setError(null);
  }, []);

  // 🎨 Renderiza las líneas de escaneo
  const renderScanlines = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const {
      opacity = 1,
      lineWidth = 1,
      lineSpacing = 2,
      speed = 0,
      color = 'rgba(0, 0, 0, 0.1)',
      blendMode = 'multiply',
      direction = 'horizontal',
      animated = false,
      offset = 0,
    } = config;

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
  }, [config, shouldRender]);

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

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeCanvas, renderScanlines, shouldRender]);

  return {
    canvasRef,
    error,
    initializeCanvas,
