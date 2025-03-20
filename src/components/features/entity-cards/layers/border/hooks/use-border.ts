import { useCallback, useEffect, useRef, useState } from 'react';
import type { BorderConfig } from '../actions/border-config.action';

interface UseBorderProps {
  config: BorderConfig;
  shouldRender: boolean;
}

interface UseBorderReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  error: string | null;
  initializeBorder: () => void;
  updateBorder: () => void;
}

export function useBorder({ config, shouldRender }: UseBorderProps): UseBorderReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Inicializar el borde
  const initializeBorder = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      setError('Contenedor no disponible');
      return;
    }

    // Aplicar estilos iniciales
    updateBorder();
  }, []);

  // Actualizar estilos del borde
  const updateBorder = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Aplicar estilos según la configuración
    container.style.borderStyle = config.style || 'solid';
    container.style.borderWidth = `${config.width || 1}px`;
    container.style.borderColor = config.color || '#ffffff';
    container.style.borderRadius = `${config.radius || 0}px`;
    container.style.opacity = `${config.opacity || 1}`;

    // Aplicar efectos especiales si están configurados
    if (config.glow) {
      container.style.boxShadow = `0 0 ${config.glowRadius || 10}px ${config.glowColor || config.color || '#ffffff'}`;
    } else {
      container.style.boxShadow = 'none';
    }

    // Aplicar gradiente si está configurado
    if (config.gradient) {
      container.style.borderImage = `linear-gradient(${config.gradientAngle || 45}deg, ${config.gradientColors?.join(', ') || '#ffffff, #000000'}) 1`;
    } else {
      container.style.borderImage = 'none';
    }
  }, [config]);

  // Efecto para inicializar
  useEffect(() => {
    if (shouldRender) {
      initializeBorder();
    }
  }, [shouldRender, initializeBorder]);

  // Efecto para actualizar cuando cambia la configuración
  useEffect(() => {
    if (shouldRender) {
      updateBorder();
    }
  }, [config, shouldRender, updateBorder]);

  return {
    containerRef,
    error,
    initializeBorder,
    updateBorder
  };
}