/**
 * @file Motor FLIP (First Last Invert Play)
 * @module lib/transitions/core/flip-engine
 * @description Implementación del algoritmo FLIP para transiciones de alto rendimiento
 * 
 * FLIP es una técnica que:
 * FIRST: Captura el estado inicial
 * LAST: Captura el estado final después del cambio
 * INVERT: Calcula la transformación inversa
 * PLAY: Anima desde la inversa hasta el estado natural
 */

import { anime } from '@/lib/anime';
import type { FlipElementConfig, FlipOptions, FlipState, PerformanceMetrics } from '../types';

// ============================================================================
// Configuración por Defecto
// ============================================================================

const DEFAULT_FLIP_OPTIONS: Required<FlipOptions> = {
  duration: 400,
  easing: 'easeOutExpo',
  delay: 0,
  extraTransforms: {},
  onStart: () => {},
  onUpdate: () => {},
  onComplete: () => {},
  animateBorderRadius: true,
  animateOpacity: false,
  respectPrefersReducedMotion: true,
};

// ============================================================================
// Utilidades
// ============================================================================

/**
 * Verifica si el usuario prefiere reducir el movimiento
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Obtiene las dimensiones y posición de un elemento
 */
function getElementRect(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * Calcula la diferencia entre dos rectángulos
 */
function calculateRectDiff(
  first: DOMRect,
  last: DOMRect
): { x: number; y: number; scaleX: number; scaleY: number } {
  const x = first.left - last.left + (first.width - last.width) / 2;
  const y = first.top - last.top + (first.height - last.height) / 2;
  const scaleX = first.width / last.width || 1;
  const scaleY = first.height / last.height || 1;

  return { x, y, scaleX, scaleY };
}

/**
 * Obtiene el border-radius computado de un elemento
 */
function getComputedBorderRadius(element: HTMLElement): string {
  const computed = window.getComputedStyle(element);
  return computed.borderRadius;
}

/**
 * Parsea valores de border-radius
 */
function parseBorderRadius(radius: string): { x: number; y: number } {
  const values = radius.split(/\s+/).map(v => parseFloat(v) || 0);
  return {
    x: values[0] || 0,
    y: values[1] || values[0] || 0,
  };
}

// ============================================================================
// Clase Principal FLIP Engine
// ============================================================================

export class FlipEngine {
  private elements = new Map<string, FlipElementConfig>();
  private states = new Map<string, FlipState>();
  private activeAnimations = new Map<string, ReturnType<typeof anime>>();
  private isTransitioning = false;
  private metrics: PerformanceMetrics = {
    startTime: 0,
  };

  /**
   * Registra un elemento para seguimiento FLIP
   */
  register(config: FlipElementConfig): void {
    this.elements.set(config.id, config);
  }

  /**
   * Desregistra un elemento
   */
  unregister(id: string): void {
    this.elements.delete(id);
    this.states.delete(id);
    this.stopAnimation(id);
  }

  /**
   * Captura el estado "FIRST" de todos los elementos registrados
   * Llamar esto ANTES de cualquier cambio de layout
   */
  captureFirst(): void {
    this.states.clear();
    
    for (const [id, config] of this.elements) {
      const rect = getElementRect(config.element);
      const borderRadius = getComputedBorderRadius(config.element);
      
      this.states.set(id, {
        rect,
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
        styles: {
          borderRadius,
          opacity: 1,
        },
      });
    }
  }

  /**
   * Captura el estado "LAST" y calcula INVERT
   * Llamar esto DESPUÉS del cambio de layout
   */
  captureLast(): void {
    for (const [id, config] of this.elements) {
      const firstState = this.states.get(id);
      if (!firstState) continue;

      const lastRect = getElementRect(config.element);
      const diff = calculateRectDiff(firstState.rect, lastRect);
      
      // Actualizar con la transformación INVERT
      this.states.set(id, {
        ...firstState,
        transform: {
          x: diff.x,
          y: diff.y,
          scaleX: diff.scaleX,
          scaleY: diff.scaleY,
        },
      });

      // Aplicar inmediatamente la transformación invertida (sin animación)
      this.applyInvert(id);
    }
  }

  /**
   * Aplica la transformación INVERT a un elemento
   */
  private applyInvert(id: string): void {
    const config = this.elements.get(id);
    const state = this.states.get(id);
    
    if (!config || !state) return;

    const { x, y, scaleX, scaleY } = state.transform;
    
    // Aplicar transformación inversa
    config.element.style.transform = `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})`;
    config.element.style.transformOrigin = 'center center';
    
    // Forzar reflow para asegurar que el cambio se aplique
    void config.element.offsetHeight;
  }

  /**
   * Ejecuta la animación "PLAY" para todos los elementos
   * Esto anima desde la transformación invertida hasta el estado natural
   */
  async play(): Promise<void> {
    if (this.isTransitioning) {
      await this.stopAllAnimations();
    }

    this.isTransitioning = true;
    this.metrics.startTime = performance.now();

    const promises: Promise<void>[] = [];

    for (const [id, config] of this.elements) {
      const promise = this.animateElement(id);
      if (promise) promises.push(promise);
    }

    await Promise.all(promises);
    
    this.isTransitioning = false;
    this.metrics.endTime = performance.now();
    this.metrics.actualDuration = this.metrics.endTime - this.metrics.startTime;
  }

  /**
   * Anima un elemento específico desde INVERT hasta natural
   */
  private animateElement(id: string): Promise<void> | null {
    const config = this.elements.get(id);
    const state = this.states.get(id);
    
    if (!config || !state) return null;

    const options = { ...DEFAULT_FLIP_OPTIONS, ...config.options };

    // Respetar preferencias de accesibilidad
    if (options.respectPrefersReducedMotion && prefersReducedMotion()) {
      config.element.style.transform = '';
      return null;
    }

    return new Promise((resolve) => {
      const animations: AnimeParams[] = [];

      // Animación principal de transformación
      animations.push({
        targets: config.element,
        translateX: [state.transform.x, 0],
        translateY: [state.transform.y, 0],
        scaleX: [state.transform.scaleX, 1],
        scaleY: [state.transform.scaleY, 1],
        duration: options.duration,
        easing: options.easing,
        delay: options.delay,
      });

      // Animar border-radius si está habilitado
      if (options.animateBorderRadius) {
        const currentRadius = getComputedBorderRadius(config.element);
        const firstRadius = parseBorderRadius(state.styles.borderRadius);
        const lastRadius = parseBorderRadius(currentRadius);

        if (firstRadius.x !== lastRadius.x || firstRadius.y !== lastRadius.y) {
          animations.push({
            targets: config.element,
            borderRadius: [`${firstRadius.x}px`, `${lastRadius.x}px`],
            duration: options.duration,
            easing: 'easeOutQuad',
            delay: options.delay,
          });
        }
      }

      // Animar opacidad si está habilitado
      if (options.animateOpacity) {
        animations.push({
          targets: config.element,
          opacity: [state.styles.opacity, 1],
          duration: options.duration * 0.8,
          easing: 'easeOutQuad',
          delay: options.delay,
        });
      }

      // Callback de inicio
      options.onStart?.();

      // Crear y ejecutar animación
      const animation = anime({
        ...animations[0],
        begin: () => {
          // Añadir will-change para optimización
          config.element.style.willChange = 'transform, opacity';
        },
        update: (anim) => {
          options.onUpdate?.(anim.progress / 100);
        },
        complete: () => {
          // Limpiar estilos
          config.element.style.transform = '';
          config.element.style.willChange = '';
          config.element.style.transformOrigin = '';
          
          options.onComplete?.();
          resolve();
        },
      });

      this.activeAnimations.set(id, animation);
    });
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
   * Detiene todas las animaciones activas
   */
  private async stopAllAnimations(): Promise<void> {
    for (const [id] of this.activeAnimations) {
      this.stopAnimation(id);
    }
    this.activeAnimations.clear();
  }

  /**
   * Ejecuta el ciclo completo FLIP en un solo método
   * Útil para casos simples donde el cambio es síncrono
   */
  async execute(changeCallback: () => void, ids?: string[]): Promise<void> {
    // FIRST
    this.captureFirst();
    
    // Ejecutar cambio
    changeCallback();
    
    // LAST + INVERT + PLAY
    this.captureLast();
    
    if (ids) {
      // Animar solo los IDs especificados
      const filteredElements = new Map<string, FlipElementConfig>();
      for (const id of ids) {
        const config = this.elements.get(id);
        if (config) filteredElements.set(id, config);
      }
      
      // Reemplazar temporalmente
      const originalElements = this.elements;
      this.elements = filteredElements;
      await this.play();
      this.elements = originalElements;
    } else {
      await this.play();
    }
  }

  /**
   * Obtiene las métricas de rendimiento de la última transición
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Verifica si hay una transición en progreso
   */
  getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Limpia todos los recursos
   */
  destroy(): void {
    this.stopAllAnimations();
    this.elements.clear();
    this.states.clear();
    this.activeAnimations.clear();
  }
}

// ============================================================================
// Instancia Singleton
// ============================================================================

let globalFlipEngine: FlipEngine | null = null;

/**
 * Obtiene la instancia global del motor FLIP
 */
export function getFlipEngine(): FlipEngine {
  if (!globalFlipEngine) {
    globalFlipEngine = new FlipEngine();
  }
  return globalFlipEngine;
}

/**
 * Destruye la instancia global
 */
export function destroyFlipEngine(): void {
  if (globalFlipEngine) {
    globalFlipEngine.destroy();
    globalFlipEngine = null;
  }
}

// ============================================================================
// Funciones de Utilidad Exportadas
// ============================================================================

/**
 * Calcula la dirección óptima para una transición basada en posiciones
 */
export function calculateOptimalDirection(
  fromRect: DOMRect,
  toRect: DOMRect
): { direction: 'x' | 'y'; distance: number; sign: 1 | -1 } {
  const deltaX = toRect.left - fromRect.left;
  const deltaY = toRect.top - fromRect.top;
  
  // Usar el eje con mayor diferencia
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return {
      direction: 'x',
      distance: Math.abs(deltaX),
      sign: deltaX > 0 ? 1 : -1,
    };
  }
  
  return {
    direction: 'y',
    distance: Math.abs(deltaY),
    sign: deltaY > 0 ? 1 : -1,
  };
}

/**
 * Determina si un elemento está fuera del viewport
 */
export function isElementInViewport(rect: DOMRect): boolean {
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

/**
 * Calcula la distancia desde un punto al centro del viewport
 */
export function distanceToViewportCenter(point: { x: number; y: number }): number {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  return Math.sqrt(
    Math.pow(point.x - centerX, 2) + 
    Math.pow(point.y - centerY, 2)
  );
}
