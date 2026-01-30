/**
 * @file Hook useMorph
 * @module hooks/transitions/use-morph
 * @description Hook React para morphing de formas con anime.js
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getMorphEngine } from '@/lib/transitions/core/morph-engine';
import type { MorphConfig } from '@/lib/transitions/types';

interface UseMorphOptions {
  /** ID único del elemento */
  id: string;
  /** Forma inicial */
  initialShape?: string;
  /** Si está habilitado */
  enabled?: boolean;
  /** Configuración base */
  config?: MorphConfig;
}

interface UseMorphReturn {
  /** Ref para asignar al elemento */
  ref: React.RefObject<HTMLElement | null>;
  /** Mofhea a una nueva forma */
  morphTo: (shape: string, overrideConfig?: Partial<MorphConfig>) => Promise<void>;
  /** Mofhea entre dos formas específicas */
  morph: (fromShape: string, toShape: string, overrideConfig?: Partial<MorphConfig>) => Promise<void>;
  /** Forma actual */
  currentShape: string;
  /** Si está animando */
  isMorphing: boolean;
}

/**
 * Hook para morphing de formas en elementos
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, morphTo, currentShape } = useMorph({ 
 *     id: 'my-element',
 *     initialShape: 'square'
 *   });
 * 
 *   return (
 *     <div>
 *       <div ref={ref} className="w-32 h-32 bg-primary" />
 *       <button onClick={() => morphTo('circle')}>Círculo</button>
 *       <button onClick={() => morphTo('rounded')}>Redondeado</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMorph(options: UseMorphOptions): UseMorphReturn {
  const { id, initialShape = 'square', enabled = true, config: baseConfig } = options;
  const ref = useRef<HTMLElement>(null);
  const engine = useRef(getMorphEngine());
  const [currentShape, setCurrentShape] = useState(initialShape);
  const [isMorphing, setIsMorphing] = useState(false);

  // Registrar elemento
  useEffect(() => {
    if (!enabled) return;
    
    engine.current.register(id, initialShape);
    
    return () => {
      engine.current.unregister(id);
    };
  }, [id, initialShape, enabled]);

  /**
   * Mofhea a una nueva forma
   */
  const morphTo = useCallback(async (
    shape: string, 
    overrideConfig?: Partial<MorphConfig>
  ): Promise<void> => {
    if (!enabled || !ref.current || shape === currentShape) return;

    setIsMorphing(true);
    
    try {
      await engine.current.morphTo(ref.current, shape, {
        ...baseConfig,
        ...overrideConfig,
      });
      setCurrentShape(shape);
    } finally {
      setIsMorphing(false);
    }
  }, [enabled, currentShape, baseConfig]);

  /**
   * Mofhea entre dos formas específicas
   */
  const morph = useCallback(async (
    fromShape: string,
    toShape: string,
    overrideConfig?: Partial<MorphConfig>
  ): Promise<void> => {
    if (!enabled || !ref.current) return;

    setIsMorphing(true);
    
    try {
      await engine.current.morph(ref.current, fromShape, toShape, {
        ...baseConfig,
        ...overrideConfig,
      });
      setCurrentShape(toShape);
    } finally {
      setIsMorphing(false);
    }
  }, [enabled, baseConfig]);

  return {
    ref: ref as React.RefObject<HTMLElement | null>,
    morphTo,
    morph,
    currentShape,
    isMorphing,
  };
}

/**
 * Hook para crear un ciclo continuo de morphing
 */
export function useMorphLoop(options: {
  id: string;
  shapes: string[];
  interval?: number;
  config?: MorphConfig;
  enabled?: boolean;
}): {
  ref: React.RefObject<HTMLElement | null>;
  start: () => void;
  stop: () => void;
  isRunning: boolean;
} {
  const { id, shapes, interval = 2000, config, enabled = true } = options;
  const ref = useRef<HTMLElement>(null);
  const engine = useRef(getMorphEngine());
  const stopRef = useRef<(() => void) | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(() => {
    if (!enabled || !ref.current || shapes.length < 2) return;
    
    stopRef.current = engine.current.createContinuousMorph(
      ref.current,
      shapes,
      { ...config, interval }
    );
    setIsRunning(true);
  }, [enabled, shapes, interval, config]);

  const stop = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
      setIsRunning(false);
    }
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ref: ref as React.RefObject<HTMLElement | null>,
    start,
    stop,
    isRunning,
  };
}
