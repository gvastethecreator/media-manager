import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useShaderStore } from '../actions/shader-config.action';
import { initializeShader, updateShaderUniforms } from '../utils/shader-utils';

interface ShaderLayerProps {
  className?: string;
  width: number;
  height: number;
}

export const ShaderLayer: React.FC<ShaderLayerProps> = ({ className, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number>(0);

  const { configs, activeType } = useShaderStore();
  const activeConfig = activeType ? configs[activeType] : null;

  // Inicializar WebGL y shaders
  useEffect(() => {
    if (!canvasRef.current || !activeType || !activeConfig?.enabled) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL no está disponible');
      return;
    }

    glRef.current = gl;
    programRef.current = initializeShader(gl, activeType);

    return () => {
      if (programRef.current) {
        gl.deleteProgram(programRef.current);
      }
      glRef.current = null;
      programRef.current = null;
    };
  }, [activeType, activeConfig?.enabled]);

  // Manejar cambios de tamaño
  useEffect(() => {
    if (!canvasRef.current || !glRef.current) return;

    const canvas = canvasRef.current;
    const gl = glRef.current;

    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }, [width, height]);

  // Loop de renderizado
  useEffect(() => {
    if (!glRef.current || !programRef.current || !activeConfig?.enabled) return;

    const gl = glRef.current;
    const program = programRef.current;

    const render = () => {
      if (!gl || !program || !activeConfig?.enabled) return;

      gl.clear(gl.COLOR_BUFFER_BIT);
      updateShaderUniforms(gl, program, activeConfig);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeConfig]);

  // Si no hay shader activo o está deshabilitado, no renderizar nada
  if (!activeType || !activeConfig?.enabled) return null;

  return (
    <motion.canvas
      ref={canvasRef}
      className={cn(
        'absolute inset-0 pointer-events-none',
        {
          'mix-blend-normal': activeConfig.blendMode === 'normal',
          'mix-blend-multiply': activeConfig.blendMode === 'multiply',
          'mix-blend-screen': activeConfig.blendMode === 'screen',
          'mix-blend-overlay': activeConfig.blendMode === 'overlay',
        },
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: activeConfig.opacity }}
      transition={{ duration: 0.3 }}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
};