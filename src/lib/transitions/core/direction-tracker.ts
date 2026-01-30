/**
 * @file Rastreador de Dirección para Transiciones Inteligentes
 * @module lib/transitions/core/direction-tracker
 * @description Calcula la dirección óptima de animación basada en la posición y contexto
 * 
 * Este módulo determina:
 * - De qué dirección debe venir un elemento al entrar
 * - Hacia qué dirección debe ir un elemento al salir
 * - Cómo coordinar múltiples elementos para transiciones coherentes
 */

import type { Point2D, TransitionDirection } from '../types';

// ============================================================================
// Configuración
// ============================================================================

interface DirectionConfig {
  /** Umbral para considerar dirección diagonal (0-1) */
  diagonalThreshold: number;
  /** Preferencia de dirección para elementos entrando */
  entryPreference: 'from-offscreen' | 'from-center' | 'from-nearest-edge';
  /** Preferencia de dirección para elementos saliendo */
  exitPreference: 'to-offscreen' | 'to-center' | 'to-nearest-edge';
  /** Margen para considerar "fuera de pantalla" */
  offscreenMargin: number;
}

const DEFAULT_CONFIG: DirectionConfig = {
  diagonalThreshold: 0.3,
  entryPreference: 'from-offscreen',
  exitPreference: 'to-offscreen',
  offscreenMargin: 100,
};

// ============================================================================
// Utilidades de Cálculo
// ============================================================================

/**
 * Calcula el ángulo entre dos puntos en grados
 */
function calculateAngle(from: Point2D, to: Point2D): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Convierte un ángulo a dirección cardinal
 */
function angleToDirection(angle: number): TransitionDirection {
  // Normalizar ángulo a 0-360
  const normalized = ((angle % 360) + 360) % 360;
  
  // Definir rangos para cada dirección
  if (normalized >= 337.5 || normalized < 22.5) return 'right';
  if (normalized >= 22.5 && normalized < 67.5) return 'bottom-right';
  if (normalized >= 67.5 && normalized < 112.5) return 'bottom';
  if (normalized >= 112.5 && normalized < 157.5) return 'bottom-left';
  if (normalized >= 157.5 && normalized < 202.5) return 'left';
  if (normalized >= 202.5 && normalized < 247.5) return 'top-left';
  if (normalized >= 247.5 && normalized < 292.5) return 'top';
  if (normalized >= 292.5 && normalized < 337.5) return 'top-right';
  
  return 'center';
}

/**
 * Obtiene el centro de un rectángulo
 */
function getRectCenter(rect: DOMRect): Point2D {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Calcula la distancia entre dos puntos
 */
function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Determina la posición relativa de un punto respecto al viewport
 */
function getViewportRelativePosition(point: Point2D): {
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'center' | 'bottom';
} {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  const horizontal = point.x < viewportWidth / 3 
    ? 'left' 
    : point.x > (viewportWidth * 2) / 3 
      ? 'right' 
      : 'center';
      
  const vertical = point.y < viewportHeight / 3 
    ? 'top' 
    : point.y > (viewportHeight * 2) / 3 
      ? 'bottom' 
      : 'center';
      
  return { horizontal, vertical };
}

// ============================================================================
// Clase Principal Direction Tracker
// ============================================================================

export class DirectionTracker {
  private config: DirectionConfig;
  private elementPositions = new Map<string, Point2D>();
  private viewportCenter: Point2D;

  constructor(config: Partial<DirectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.viewportCenter = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    
    // Actualizar centro del viewport en resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.viewportCenter = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        };
      });
    }
  }

  /**
   * Registra la posición previa de un elemento
   */
  registerPosition(id: string, position: Point2D): void {
    this.elementPositions.set(id, position);
  }

  /**
   * Calcula la dirección óptima de entrada para un elemento
   */
  calculateEntryDirection(
    targetRect: DOMRect,
    fromPosition?: Point2D,
    previousRect?: DOMRect
  ): TransitionDirection {
    const targetCenter = getRectCenter(targetRect);

    // Si tenemos posición previa, calcular dirección desde allí
    if (previousRect) {
      const prevCenter = getRectCenter(previousRect);
      const angle = calculateAngle(prevCenter, targetCenter);
      return angleToDirection(angle);
    }

    // Si se especifica origen, usarlo
    if (fromPosition) {
      const angle = calculateAngle(fromPosition, targetCenter);
      return angleToDirection(angle);
    }

    // Calcular según preferencia configurada
    switch (this.config.entryPreference) {
      case 'from-offscreen':
        return this.calculateOffscreenEntryDirection(targetCenter);
      
      case 'from-center':
        return angleToDirection(calculateAngle(this.viewportCenter, targetCenter));
      
      case 'from-nearest-edge':
        return this.calculateNearestEdgeDirection(targetCenter);
      
      default:
        return 'bottom';
    }
  }

  /**
   * Calcula la dirección óptima de salida para un elemento
   */
  calculateExitDirection(
    currentRect: DOMRect,
    toPosition?: Point2D,
    strategy: 'away' | 'toward' | 'same' = 'away'
  ): TransitionDirection {
    const currentCenter = getRectCenter(currentRect);

    if (toPosition) {
      const angle = calculateAngle(currentCenter, toPosition);
      return angleToDirection(angle);
    }

    // Calcular según preferencia configurada
    switch (this.config.exitPreference) {
      case 'to-offscreen':
        return this.calculateOffscreenExitDirection(currentCenter);
      
      case 'to-center':
        return angleToDirection(calculateAngle(currentCenter, this.viewportCenter));
      
      case 'to-nearest-edge':
        return this.calculateNearestEdgeDirection(currentCenter, true);
      
      default:
        return 'bottom';
    }
  }

  /**
   * Calcula dirección de entrada desde fuera de pantalla
   */
  private calculateOffscreenEntryDirection(targetCenter: Point2D): TransitionDirection {
    const { horizontal, vertical } = getViewportRelativePosition(targetCenter);
    
    // Combinar posiciones horizontales y verticales
    if (horizontal === 'left') {
      if (vertical === 'top') return 'top-left';
      if (vertical === 'bottom') return 'bottom-left';
      return 'left';
    }
    
    if (horizontal === 'right') {
      if (vertical === 'top') return 'top-right';
      if (vertical === 'bottom') return 'bottom-right';
      return 'right';
    }
    
    // Centro horizontal
    if (vertical === 'top') return 'top';
    if (vertical === 'bottom') return 'bottom';
    
    // Elemento en centro, entrar desde abajo por defecto
    return 'bottom';
  }

  /**
   * Calcula dirección de salida hacia fuera de pantalla
   */
  private calculateOffscreenExitDirection(currentCenter: Point2D): TransitionDirection {
    // Calcular vector desde centro del viewport
    const dx = currentCenter.x - this.viewportCenter.x;
    const dy = currentCenter.y - this.viewportCenter.y;
    
    // Normalizar
    const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
    const normalizedDx = dx / magnitude;
    const normalizedDy = dy / magnitude;
    
    // Convertir a ángulo y dirección
    const angle = Math.atan2(normalizedDy, normalizedDx) * (180 / Math.PI);
    return angleToDirection(angle);
  }

  /**
   * Calcula dirección desde/hacia el borde más cercano
   */
  private calculateNearestEdgeDirection(point: Point2D, invert = false): TransitionDirection {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calcular distancias a cada borde
    const distances = {
      left: point.x,
      right: viewportWidth - point.x,
      top: point.y,
      bottom: viewportHeight - point.y,
    };
    
    // Encontrar la distancia mínima
    const nearestEdge = Object.entries(distances).reduce((min, [edge, dist]) => 
      dist < min.dist ? { edge, dist } : min,
      { edge: 'left', dist: distances.left }
    );
    
    // Si invertir, devolver dirección opuesta
    if (invert) {
      const opposites: Record<string, TransitionDirection> = {
        left: 'right',
        right: 'left',
        top: 'bottom',
        bottom: 'top',
      };
      return opposites[nearestEdge.edge];
    }
    
    return nearestEdge.edge as TransitionDirection;
  }

  /**
   * Calcula vector de desplazamiento para una dirección
   */
  calculateDisplacementVector(
    direction: TransitionDirection,
    distance: number
  ): { x: number; y: number } {
    const vectors: Record<TransitionDirection, Point2D> = {
      'top': { x: 0, y: -distance },
      'bottom': { x: 0, y: distance },
      'left': { x: -distance, y: 0 },
      'right': { x: distance, y: 0 },
      'top-left': { x: -distance * 0.707, y: -distance * 0.707 },
      'top-right': { x: distance * 0.707, y: -distance * 0.707 },
      'bottom-left': { x: -distance * 0.707, y: distance * 0.707 },
      'bottom-right': { x: distance * 0.707, y: distance * 0.707 },
      'center': { x: 0, y: 0 },
      'auto': { x: 0, y: distance },
    };
    
    return vectors[direction] || vectors['bottom'];
  }

  /**
   * Coordina direcciones para un grupo de elementos
   * Crea un efecto de "oleada" coherente
   */
  coordinateGroupDirections(
    elements: { id: string; rect: DOMRect; index: number }[],
    baseDirection: TransitionDirection
  ): Map<string, TransitionDirection> {
    const directions = new Map<string, TransitionDirection>();
    
    // Calcular centro del grupo
    const groupCenter = elements.reduce(
      (acc, el) => ({
        x: acc.x + el.rect.left + el.rect.width / 2,
        y: acc.y + el.rect.top + el.rect.height / 2,
      }),
      { x: 0, y: 0 }
    );
    
    groupCenter.x /= elements.length;
    groupCenter.y /= elements.length;
    
    // Asignar direcciones basadas en posición relativa al centro
    for (const el of elements) {
      const elCenter = getRectCenter(el.rect);
      
      // Si es el elemento central, usar dirección base
      if (distance(elCenter, groupCenter) < 50) {
        directions.set(el.id, baseDirection);
        continue;
      }
      
      // Calcular dirección desde el centro del grupo hacia el elemento
      const angle = calculateAngle(groupCenter, elCenter);
      const relativeDirection = angleToDirection(angle);
      
      directions.set(el.id, relativeDirection);
    }
    
    return directions;
  }

  /**
   * Calcula progresión de delays para efecto stagger
   */
  calculateStaggerDelays(
    elements: { id: string; rect: DOMRect }[],
    baseDelay: number,
    maxDelay: number,
    pattern: 'linear' | 'radial' | 'random' = 'linear'
  ): Map<string, number> {
    const delays = new Map<string, number>();
    
    switch (pattern) {
      case 'linear':
        // Distribuir uniformemente
        elements.forEach((el, index) => {
          const progress = index / (elements.length - 1 || 1);
          delays.set(el.id, baseDelay + progress * maxDelay);
        });
        break;
      
      case 'radial': {
        // Desde el centro hacia afuera
        const center = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        };
        
        const withDistances = elements.map(el => ({
          ...el,
          distance: distance(getRectCenter(el.rect), center),
        }));
        
        const maxDist = Math.max(...withDistances.map(e => e.distance));
        
        withDistances.forEach(el => {
          const progress = el.distance / (maxDist || 1);
          delays.set(el.id, baseDelay + progress * maxDelay);
        });
        break;
      }
      
      case 'random':
        elements.forEach(el => {
          delays.set(el.id, baseDelay + Math.random() * maxDelay);
        });
        break;
    }
    
    return delays;
  }

  /**
   * Limpia datos almacenados
   */
  clear(): void {
    this.elementPositions.clear();
  }
}

// ============================================================================
// Instancia Singleton
// ============================================================================

let globalDirectionTracker: DirectionTracker | null = null;

export function getDirectionTracker(config?: Partial<DirectionConfig>): DirectionTracker {
  if (!globalDirectionTracker) {
    globalDirectionTracker = new DirectionTracker(config);
  }
  return globalDirectionTracker;
}

export function destroyDirectionTracker(): void {
  if (globalDirectionTracker) {
    globalDirectionTracker.clear();
    globalDirectionTracker = null;
  }
}

// ============================================================================
// Funciones de Utilidad Exportadas
// ============================================================================

/**
 * Determina si una dirección es diagonal
 */
export function isDiagonalDirection(direction: TransitionDirection): boolean {
  return ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(direction);
}

/**
 * Obtiene el componente opuesto de una dirección
 */
export function getOppositeDirection(direction: TransitionDirection): TransitionDirection {
  const opposites: Record<TransitionDirection, TransitionDirection> = {
    'top': 'bottom',
    'bottom': 'top',
    'left': 'right',
    'right': 'left',
    'top-left': 'bottom-right',
    'top-right': 'bottom-left',
    'bottom-left': 'top-right',
    'bottom-right': 'top-left',
    'center': 'center',
    'auto': 'auto',
  };
  
  return opposites[direction];
}

/**
 * Combina dos direcciones para obtener una diagonal
 */
export function combineDirections(
  horizontal: 'left' | 'right' | 'center',
  vertical: 'top' | 'bottom' | 'center'
): TransitionDirection {
  if (horizontal === 'center' && vertical === 'center') return 'center';
  if (horizontal === 'center') return vertical;
  if (vertical === 'center') return horizontal;
  
  return `${vertical}-${horizontal}` as TransitionDirection;
}

/**
 * Predice la posición futura basada en velocidad
 */
export function predictPosition(
  currentPosition: Point2D,
  velocity: Point2D,
  timeDelta: number
): Point2D {
  return {
    x: currentPosition.x + velocity.x * timeDelta,
    y: currentPosition.y + velocity.y * timeDelta,
  };
}
