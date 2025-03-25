import { useCallback, useEffect, useRef, useState } from 'react';
import type { TextureConfig } from '../texture-config-types';

interface UseTextureProps {
  config: TextureConfig;
  shouldRender: boolean;
}

interface UseTextureReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  error: string | null;
  initializeCanvas: () => void;
  renderTexture: () => void;
}

export const useTexture = ({ config, shouldRender }: UseTextureProps): UseTextureReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const textureImageRef = useRef<HTMLImageElement | null>(null);

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

  // 🖼️ Carga la imagen de textura
  const loadTextureImage = useCallback(() => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Error al cargar la textura'));
      img.src = config.textureUrl;
    });
  }, [config.textureUrl]);

  // 🎨 Renderiza la textura en el canvas
  const renderTexture = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const {
      opacity = 1,
      scale = 1,
      rotation = 0,
      blendMode = 'normal',
      offsetX = 0,
      offsetY = 0,
      tileMode = 'repeat',
    } = config;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;

    if (textureImageRef.current) {
      const img = textureImageRef.current;
      const pattern = ctx.createPattern(img, tileMode as CanvasPattern['repetition']);

      if (pattern) {
        // Crear matriz de transformación
        const matrix = new DOMMatrix()
          .translate(offsetX, offsetY)
          .rotate(rotation)
          .scale(scale, scale);

        pattern.setTransform(matrix);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [config]);

  // 🔄 Efecto para cargar la textura cuando cambia la URL
  useEffect(() => {
    if (shouldRender && config.textureUrl) {
      loadTextureImage()
        .then((img) => {
          textureImageRef.current = img;
          renderTexture();
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  }, [config.textureUrl, loadTextureImage, renderTexture, shouldRender]);

  // 🔄 Efecto para renderizar cuando cambian las propiedades
  useEffect(() => {
    if (shouldRender && textureImageRef.current) {
      renderTexture();
    }
  }, [
    shouldRender,
    config.opacity,
    config.scale,
    config.rotation,
    config.blendMode,
    config.offsetX,
    config.offsetY,
    config.tileMode,
    renderTexture,
  ]);

  // 📏 Efecto para manejar el redimensionamiento
  useEffect(() => {
    const handleResize = () => {
      initializeCanvas();
      if (shouldRender && textureImageRef.current) {
        renderTexture();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeCanvas, renderTexture, shouldRender]);

  return {
    canvasRef,
    error,
    initializeCanvas,
    renderTexture,
  };
};