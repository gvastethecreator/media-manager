import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShaderConfig } from '../actions/shader-config.action';
import { initializeShader, updateShaderUniforms } from '../utils/shader-utils';

interface UseShaderProps {
  config: ShaderConfig;
  shouldRender: boolean;
}

interface UseShaderReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  error: string | null;
  initializeShaderEffect: () => void;
  updateShaderEffect: () => void;
}

export function useShader({ config, shouldRender }: UseShaderProps): UseShaderReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inicializar el shader
  const initializeShaderEffect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas no disponible');
      return;
    }

    try {
      // Obtener contexto WebGL
      const gl = canvas.getContext('webgl');
      if (!gl) {
        setError('WebGL no soportado');
        return;
      }

      // Guardar referencia al contexto
      glRef.current = gl;

      // Inicializar shader según el tipo
      const program = initializeShader(gl, config.type);
      if (!program) {
        setError('Error al inicializar shader');
        return;
      }

      // Guardar referencia al programa
      programRef.current = program;

      // Configurar tamaño del canvas
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Actualizar uniforms iniciales
      updateShaderEffect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [config.type]);

  // Actualizar uniforms del shader
  const updateShaderEffect = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    try {
      // Actualizar uniforms según la configuración
      updateShaderUniforms(gl, program, config);

      // Renderizar
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar shader');
    }
  }, [config]);

  // Efecto para inicializar
  useEffect(() => {
    if (shouldRender) {
      initializeShaderEffect();
    }
  }, [shouldRender, initializeShaderEffect]);

  // Efecto para actualizar cuando cambia la configuración
  useEffect(() => {
    if (shouldRender) {
      updateShaderEffect();
    }
  }, [config, shouldRender, updateShaderEffect]);

  // Efecto para manejar resize
  useEffect(() => {
    const handleResize = () => {
      if (shouldRender) {
        initializeShaderEffect();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [shouldRender, initializeShaderEffect]);

  return {
    canvasRef,
    error,
    initializeShaderEffect,
    updateShaderEffect
  };
}