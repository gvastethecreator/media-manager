/**
 * @file Motor de Morphing de Formas
 * @module lib/transitions/core/morph-engine
 * @description Implementación de morphing para transformaciones de formas fluidas
 * 
 * Soporta:
 * - Border radius morphing (círculo a cuadrado, etc.)
 * - Clip-path morphing
 * - Transformaciones de contenedor
 * - Cambios de color coordinados
 */

import { anime } from '@/lib/anime';
import type { MorphConfig, MorphProperty, MorphState } from '../types';

// ============================================================================
// Configuración por Defecto
// ============================================================================

const DEFAULT_MORPH_CONFIG: Required<MorphConfig> = {
  duration: 500,
  easing: 'easeInOutCubic',
  delay: 0,
  fromShape: '',
  toShape: '',
  properties: ['borderRadius', 'clipPath'],
};

// ============================================================================
// Utilidades de Formas
// ============================================================================

/**
 * Genera un clip-path para diferentes formas
 */
export function generateClipPath(shape: string, size: number = 100): string {
  switch (shape.toLowerCase()) {
    case 'circle':
      return `circle(50% at 50% 50%)`;
    
    case 'ellipse':
      return `ellipse(50% 35% at 50% 50%)`;
    
    case 'triangle':
      return `polygon(50% 0%, 0% 100%, 100% 100%)`;
    
    case 'diamond':
      return `polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)`;
    
    case 'hexagon':
      return `polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)`;
    
    case 'star':
      return `polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)`;
    
    case 'card':
      return `polygon(0% 5%, 5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%)`;
    
    case 'rounded':
      return `polygon(
        0% 10%, 10% 0%, 90% 0%, 100% 10%,
        100% 90%, 90% 100%, 10% 100%, 0% 90%
      )`;
    
    case 'blob':
      // Forma orgánica tipo blob
      return `polygon(
        30% 0%, 70% 0%, 100% 30%, 100% 70%,
        70% 100%, 30% 100%, 0% 70%, 0% 30%
      )`;
    
    case 'square':
    default:
      return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`;
  }
}

/**
 * Genera valores de border-radius para diferentes formas
 */
export function generateBorderRadius(shape: string): string {
  switch (shape.toLowerCase()) {
    case 'circle':
      return '50%';
    
    case 'pill':
      return '9999px';
    
    case 'rounded':
      return '16px';
    
    case 'card':
      return '12px';
    
    case 'sharp':
      return '0px';
    
    case 'organic':
      // Border-radius asimétrico para forma orgánica
      return '60% 40% 30% 70% / 60% 30% 70% 40%';
    
    case 'square':
    default:
      return '0px';
  }
}

/**
 * Interpola entre dos valores numéricos
 */
function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/**
 * Parsea un valor de border-radius complejo
 */
function parseComplexBorderRadius(value: string): number[] {
  // Simplificar: extraer solo el primer valor numérico
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? [parseFloat(match[1])] : [0];
}

// ============================================================================
// Clase Principal Morph Engine
// ============================================================================

export class MorphEngine {
  private states = new Map<string, MorphState>();
  private activeAnimations = new Map<string, ReturnType<typeof anime>>();

  /**
   * Registra un elemento para morphing
   */
  register(id: string, initialShape: string = 'square'): void {
    this.states.set(id, {
      currentShape: initialShape,
      progress: 0,
    });
  }

  /**
   * Desregistra un elemento
   */
  unregister(id: string): void {
    this.stopAnimation(id);
    this.states.delete(id);
  }

  /**
   * Mofhea un elemento de una forma a otra
   */
  async morph(
    element: HTMLElement,
    fromShape: string,
    toShape: string,
    config: Partial<MorphConfig> = {}
  ): Promise<void> {
    const options = { ...DEFAULT_MORPH_CONFIG, ...config };
    const id = element.dataset.morphId || Math.random().toString(36).substr(2, 9);
    
    // Detener animación previa
    this.stopAnimation(id);

    return new Promise((resolve) => {
      const animations: AnimeParams[] = [];

      // Preparar valores iniciales y finales
      const fromClipPath = generateClipPath(fromShape);
      const toClipPath = generateClipPath(toShape);
      const fromRadius = generateBorderRadius(fromShape);
      const toRadius = generateBorderRadius(toShape);

      // Animar clip-path si es soportado y está en las propiedades
      if (options.properties.includes('clipPath') && CSS.supports('clip-path', fromClipPath)) {
        // Crear wrapper para animar clip-path
        const clipParams: AnimeParams = {
          targets: {}, // objeto dummy
          duration: options.duration,
          easing: options.easing,
          delay: options.delay,
          update: (anim) => {
            const progress = anim.progress / 100;
            // Interpolar entre formas complejas requiere morphing SVG
            // Por ahora usamos crossfade simple
            if (progress < 0.5) {
              element.style.clipPath = fromClipPath;
            } else {
              element.style.clipPath = toClipPath;
            }
          },
        };
        animations.push(clipParams);
      }

      // Animar border-radius
      if (options.properties.includes('borderRadius')) {
        // Para border-radius complejos, animamos el contenedor
        const fromValues = parseComplexBorderRadius(fromRadius);
        const toValues = parseComplexBorderRadius(toRadius);
        
        animations.push({
          targets: element.style,
          borderRadius: [fromRadius, toRadius],
          duration: options.duration,
          easing: options.easing,
          delay: options.delay,
          round: 1,
        });
      }

      // Animar dimensiones si es necesario
      if (options.properties.includes('width') || options.properties.includes('height')) {
        // Estas se manejan mejor con FLIP, pero podemos añadir efectos adicionales
      }

      // Configurar estado inicial
      element.style.clipPath = fromClipPath;
      element.style.borderRadius = fromRadius;
      element.style.overflow = 'hidden';

      // Crear animación
      const animation = anime({
        targets: element,
        duration: options.duration,
        easing: options.easing,
        delay: options.delay,
        begin: () => {
          element.style.willChange = 'clip-path, border-radius, transform';
        },
        complete: () => {
          // Aplicar estado final
          element.style.clipPath = toClipPath;
          element.style.borderRadius = toRadius;
          element.style.willChange = '';
          
          // Actualizar estado
          this.states.set(id, {
            currentShape: toShape,
            progress: 1,
          });
          
          resolve();
        },
      });

      // Ejecutar animaciones adicionales en paralelo
      if (animations.length > 1) {
        anime({
          targets: element,
          borderRadius: [fromRadius, toRadius],
          duration: options.duration,
          easing: options.easing,
          delay: options.delay,
        });
      }

      this.activeAnimations.set(id, animation);
    });
  }

  /**
   * Mofhea un elemento a una nueva forma (usando forma actual como origen)
   */
  async morphTo(
    element: HTMLElement,
    toShape: string,
    config: Partial<MorphConfig> = {}
  ): Promise<void> {
    const id = element.dataset.morphId || '';
    const state = this.states.get(id);
    const fromShape = state?.currentShape || 'square';
    
    await this.morph(element, fromShape, toShape, config);
  }

  /**
   * Crea un efecto de morphing continuo (loop)
   */
  createContinuousMorph(
    element: HTMLElement,
    shapes: string[],
    config: Partial<MorphConfig> & { interval?: number } = {}
  ): () => void {
    const { interval = 2000, ...morphConfig } = config;
    let currentIndex = 0;
    let isActive = true;

    const morphNext = async () => {
      if (!isActive) return;

      const currentShape = shapes[currentIndex];
      const nextShape = shapes[(currentIndex + 1) % shapes.length];

      await this.morph(element, currentShape, nextShape, {
        ...morphConfig,
        duration: morphConfig.duration || 800,
      });

      currentIndex = (currentIndex + 1) % shapes.length;

      if (isActive) {
        setTimeout(morphNext, interval);
      }
    };

    // Iniciar ciclo
    morphNext();

    // Retornar función de limpieza
    return () => {
      isActive = false;
    };
  }

  /**
   * Detiene la animación de un elemento
   */
  private stopAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.pause();
      this.activeAnimations.delete(id);
    }
  }

  /**
   * Obtiene el estado actual de un elemento
   */
  getState(id: string): MorphState | undefined {
    return this.states.get(id);
  }

  /**
   * Limpia todos los recursos
   */
  destroy(): void {
    for (const [id] of this.activeAnimations) {
      this.stopAnimation(id);
    }
    this.activeAnimations.clear();
    this.states.clear();
  }
}

// ============================================================================
// Instancia Singleton
// ============================================================================

let globalMorphEngine: MorphEngine | null = null;

export function getMorphEngine(): MorphEngine {
  if (!globalMorphEngine) {
    globalMorphEngine = new MorphEngine();
  }
  return globalMorphEngine;
}

export function destroyMorphEngine(): void {
  if (globalMorphEngine) {
    globalMorphEngine.destroy();
    globalMorphEngine = null;
  }
}

// ============================================================================
// Funciones de Utilidad Exportadas
// ============================================================================

/**
 * Crea un morphing de contenedor con efecto de "líquido"
 */
export function createLiquidMorph(
  element: HTMLElement,
  intensity: number = 0.3,
  duration: number = 1000
): ReturnType<typeof anime> {
  // Crear keyframes para efecto orgánico
  const keyframes = [];
  const steps = 8;
  
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const angle = progress * Math.PI * 2;
    
    // Crear variaciones orgánicas del border-radius
    const r1 = 50 + Math.sin(angle) * intensity * 50;
    const r2 = 50 + Math.cos(angle * 1.3) * intensity * 50;
    const r3 = 50 + Math.sin(angle * 0.7) * intensity * 50;
    const r4 = 50 + Math.cos(angle * 1.7) * intensity * 50;
    
    keyframes.push({
      borderRadius: `${r1}% ${100 - r1}% ${r2}% ${100 - r2}% / ${r3}% ${r4}% ${100 - r4}% ${100 - r3}%`,
    });
  }

  return anime({
    targets: element,
    keyframes,
    duration,
    easing: 'linear',
    loop: true,
  });
}

/**
 * Morphing de expansión desde un punto
 */
export function createExpandFromPoint(
  element: HTMLElement,
  origin: { x: number; y: number },
  config: Partial<MorphConfig> = {}
): Promise<void> {
  const options = { ...DEFAULT_MORPH_CONFIG, ...config };
  
  // Guardar estado original
  const originalTransform = element.style.transform;
  const originalClipPath = element.style.clipPath;
  
  // Calcular clip-path inicial (círculo pequeño en el origen)
  const rect = element.getBoundingClientRect();
  const originX = ((origin.x - rect.left) / rect.width) * 100;
  const originY = ((origin.y - rect.top) / rect.height) * 100;
  
  return new Promise((resolve) => {
    // Estado inicial: clip-path pequeño
    element.style.clipPath = `circle(0% at ${originX}% ${originY}%)`;
    
    anime({
      targets: element,
      clipPath: `circle(150% at ${originX}% ${originY}%)`,
      duration: options.duration,
      easing: options.easing,
      delay: options.delay,
      begin: () => {
        element.style.willChange = 'clip-path';
      },
      complete: () => {
        element.style.clipPath = originalClipPath || '';
        element.style.willChange = '';
        resolve();
      },
    });
  });
}

/**
 * Morphing de contracción hacia un punto
 */
export function createContractToPoint(
  element: HTMLElement,
  target: { x: number; y: number },
  config: Partial<MorphConfig> = {}
): Promise<void> {
  const options = { ...DEFAULT_MORPH_CONFIG, ...config };
  
  const rect = element.getBoundingClientRect();
  const targetX = ((target.x - rect.left) / rect.width) * 100;
  const targetY = ((target.y - rect.top) / rect.height) * 100;
  
  return new Promise((resolve) => {
    anime({
      targets: element,
      clipPath: [
        `circle(150% at ${targetX}% ${targetY}%)`,
        `circle(0% at ${targetX}% ${targetY}%)`,
      ],
      duration: options.duration,
      easing: options.easing,
      delay: options.delay,
      begin: () => {
        element.style.willChange = 'clip-path';
      },
      complete: () => {
        element.style.willChange = '';
        resolve();
      },
    });
  });
}
