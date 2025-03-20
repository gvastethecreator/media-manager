import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnimatedBorderConfig } from '../actions/animated-border-config.action';

interface UseAnimatedBorderProps {
  config: AnimatedBorderConfig;
  shouldRender: boolean;
}

interface UseAnimatedBorderReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  error: string | null;
  initializeCanvas: () => void;
  renderBorder: () => void;
}

export function useAnimatedBorder({ config, shouldRender }: UseAnimatedBorderProps): UseAnimatedBorderReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Inicializar el canvas
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas no disponible');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Contexto 2D no disponible');
      return;
    }

    // Configurar el tamaño del canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  // Renderizar el borde animado
  const renderBorder = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aplicar configuración
    ctx.strokeStyle = config.color || '#ffffff';
    ctx.lineWidth = config.width || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Calcular el patrón de animación
    const time = Date.now() * (config.speed || 0.001);
    const segments = config.segments || 4;
    const radius = Math.min(canvas.width, canvas.height) / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Dibujar el borde animado
    ctx.beginPath();
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + time;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    // Solicitar el siguiente frame si la animación está activa
    if (shouldRender) {
      requestAnimationFrame(renderBorder);
    }
  }, [config, shouldRender]);

  // Efecto para inicializar y manejar el ciclo de vida
  useEffect(() => {
    if (shouldRender) {
      initializeCanvas();
      renderBorder();
    }
  }, [shouldRender, initializeCanvas, renderBorder]);

  // Efecto para manejar el resize
  useEffect(() => {
    const handleResize = () => {
      if (shouldRender) {
        initializeCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [shouldRender, initializeCanvas]);

  return {
    canvasRef,
    error,
    initializeCanvas,
    renderBorder
  };
}