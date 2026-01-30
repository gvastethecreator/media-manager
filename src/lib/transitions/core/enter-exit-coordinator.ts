/**
 * @file Coordinador de Entradas y Salidas
 * @module lib/transitions/core/enter-exit-coordinator
 * @description Coordina animaciones de entrada y salida de múltiples elementos
 * 
 * Características:
 * - Stagger delays optimizados
 * - Orígenes de animación precisos
 * - Sincronización de grupos
 * - Evita animaciones conflictivas
 */

import { anime } from '@/lib/anime';
import type { 
  EnterConfig, 
  ExitConfig, 
  EnterExitConfig, 
  TransitionDirection,
  TransitionGroupConfig 
} from '../types';
import { getDirectionTracker } from './direction-tracker';
import { getDirectionalEnterPreset, getDirectionalExitPreset } from '../animations/presets';

// ============================================================================
// Configuración por Defecto
// ============================================================================

const DEFAULT_ENTER_CONFIG: Required<EnterConfig> = {
  type: 'slide',
  direction: 'bottom',
  distance: 30,
  initialScale: 0.9,
  initialOpacity: 0,
  initialBlur: 0,
  duration: 400,
  delay: 0,
  easing: 'easeOutExpo',
};

const DEFAULT_EXIT_CONFIG: Required<ExitConfig> = {
  type: 'slide',
  direction: 'top',
  distance: 30,
  finalScale: 0.9,
  finalOpacity: 0,
  finalBlur: 0,
  duration: 300,
  delay: 0,
  easing: 'easeInExpo',
  keepSpace: false,
};

// ============================================================================
// Clase Principal del Coordinador
// ============================================================================

interface ElementEntry {
  id: string;
  element: HTMLElement;
  index: number;
  group?: string;
  config?: Partial<EnterExitConfig>;
}

interface ActiveTransition {
  element: HTMLElement;
  animation: ReturnType<typeof anime>;
  type: 'enter' | 'exit';
}

export class EnterExitCoordinator {
  private activeTransitions = new Map<string, ActiveTransition>();
  private groups = new Map<string, TransitionGroupConfig>();
  private directionTracker = getDirectionTracker();
  private isProcessing = false;
  private queue: (() => Promise<void>)[] = [];

  /**
   * Registra un grupo de transición
   */
  registerGroup(config: TransitionGroupConfig): void {
    this.groups.set(config.id, config);
  }

  /**
   * Desregistra un grupo
   */
  unregisterGroup(id: string): void {
    this.groups.delete(id);
  }

  /**
   * Coordina la entrada de múltiples elementos
   */
  async coordinateEnter(
    elements: ElementEntry[],
    globalConfig: Partial<EnterConfig> = {}
  ): Promise<void> {
    if (this.isProcessing) {
      // Encolar para procesar después
      return new Promise((resolve) => {
        this.queue.push(async () => {
          await this.coordinateEnter(elements, globalConfig);
          resolve();
        });
      });
    }

    this.isProcessing = true;

    try {
      // Agrupar por grupos
      const groupedElements = this.groupElements(elements);
      
      // Procesar cada grupo
      const promises: Promise<void>[] = [];
      
      for (const [groupId, groupElements] of groupedElements) {
        const groupConfig = this.groups.get(groupId);
        const promise = this.animateGroupEnter(groupElements, groupConfig, globalConfig);
        promises.push(promise);
      }

      await Promise.all(promises);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }

  /**
   * Coordina la salida de múltiples elementos
   */
  async coordinateExit(
    elements: ElementEntry[],
    globalConfig: Partial<ExitConfig> = {}
  ): Promise<void> {
    if (this.isProcessing) {
      return new Promise((resolve) => {
        this.queue.push(async () => {
          await this.coordinateExit(elements, globalConfig);
          resolve();
        });
      });
    }

    this.isProcessing = true;

    try {
      const groupedElements = this.groupElements(elements);
      const promises: Promise<void>[] = [];

      for (const [groupId, groupElements] of groupedElements) {
        const groupConfig = this.groups.get(groupId);
        const promise = this.animateGroupExit(groupElements, groupConfig, globalConfig);
        promises.push(promise);
      }

      await Promise.all(promises);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }

  /**
   * Realiza un reemplazo coordinado (salida + entrada)
   */
  async coordinateReplace(
    exitingElements: ElementEntry[],
    enteringElements: ElementEntry[],
    options: {
      exitConfig?: Partial<ExitConfig>;
      enterConfig?: Partial<EnterConfig>;
      overlap?: number;
    } = {}
  ): Promise<void> {
    const { exitConfig = {}, enterConfig = {}, overlap = 0.2 } = options;

    // Iniciar salidas
    const exitPromise = this.coordinateExit(exitingElements, exitConfig);

    // Esperar tiempo de overlap antes de iniciar entradas
    const exitDuration = exitConfig.duration || DEFAULT_EXIT_CONFIG.duration;
    const enterDelay = exitDuration * (1 - overlap);

    await new Promise(resolve => setTimeout(resolve, enterDelay));

    // Iniciar entradas mientras las salidas continúan
    const enterPromise = this.coordinateEnter(enteringElements, enterConfig);

    await Promise.all([exitPromise, enterPromise]);
  }

  /**
   * Agrupa elementos según su configuración
   */
  private groupElements(elements: ElementEntry[]): Map<string, ElementEntry[]> {
    const groups = new Map<string, ElementEntry[]>();

    for (const element of elements) {
      const groupId = element.group || '__default__';
      
      if (!groups.has(groupId)) {
        groups.set(groupId, []);
      }
      
      groups.get(groupId)!.push(element);
    }

    return groups;
  }

  /**
   * Anima la entrada de un grupo
   */
  private async animateGroupEnter(
    elements: ElementEntry[],
    groupConfig: TransitionGroupConfig | undefined,
    globalConfig: Partial<EnterConfig>
  ): Promise<void> {
    // Calcular delays de stagger
    const staggerDelays = this.calculateStaggerDelays(elements, groupConfig);

    // Calcular direcciones coordinadas
    const directions = this.coordinateDirections(elements, 'enter');

    const promises: Promise<void>[] = [];

    for (const entry of elements) {
      const promise = this.animateSingleEnter(
        entry,
        staggerDelays.get(entry.id) || 0,
        directions.get(entry.id) || globalConfig.direction || DEFAULT_ENTER_CONFIG.direction,
        { ...DEFAULT_ENTER_CONFIG, ...globalConfig, ...entry.config?.enter }
      );
      promises.push(promise);
    }

    await Promise.all(promises);
  }

  /**
   * Anima la salida de un grupo
   */
  private async animateGroupExit(
    elements: ElementEntry[],
    groupConfig: TransitionGroupConfig | undefined,
    globalConfig: Partial<ExitConfig>
  ): Promise<void> {
    const staggerDelays = this.calculateStaggerDelays(elements, groupConfig, true);
    const directions = this.coordinateDirections(elements, 'exit');

    const promises: Promise<void>[] = [];

    for (const entry of elements) {
      const promise = this.animateSingleExit(
        entry,
        staggerDelays.get(entry.id) || 0,
        directions.get(entry.id) || globalConfig.direction || DEFAULT_EXIT_CONFIG.direction,
        { ...DEFAULT_EXIT_CONFIG, ...globalConfig, ...entry.config?.exit }
      );
      promises.push(promise);
    }

    await Promise.all(promises);
  }

  /**
   * Anima la entrada de un solo elemento
   */
  private async animateSingleEnter(
    entry: ElementEntry,
    delay: number,
    direction: TransitionDirection,
    config: EnterConfig
  ): Promise<void> {
    const { element, id } = entry;

    // Detener animación previa
    this.stopTransition(id);

    // Obtener preset direccional
    const preset = getDirectionalEnterPreset(direction, config.distance);

    // Preparar estado inicial
    element.style.opacity = String(config.initialOpacity ?? 0);
    
    if (config.initialBlur) {
      element.style.filter = `blur(${config.initialBlur}px)`;
    }

    // Aplicar transformación inicial según tipo
    const transforms = this.getEnterTransforms(direction, config);
    element.style.transform = transforms.initial;

    // Forzar reflow
    void element.offsetHeight;

    return new Promise((resolve) => {
      // Configurar animación
      const animation = anime({
        targets: element,
        opacity: [config.initialOpacity ?? 0, 1],
        translateX: transforms.translateX,
        translateY: transforms.translateY,
        scale: [config.initialScale ?? 1, 1],
        filter: config.initialBlur ? [`blur(${config.initialBlur}px)`, 'blur(0px)'] : undefined,
        duration: config.duration,
        easing: config.easing,
        delay,
        begin: () => {
          element.style.willChange = 'transform, opacity';
          if (config.initialBlur) {
            element.style.willChange += ', filter';
          }
        },
        complete: () => {
          // Limpiar estilos
          element.style.transform = '';
          element.style.opacity = '';
          element.style.filter = '';
          element.style.willChange = '';
          
          this.activeTransitions.delete(id);
          resolve();
        },
      });

      this.activeTransitions.set(id, { element, animation, type: 'enter' });
    });
  }

  /**
   * Anima la salida de un solo elemento
   */
  private async animateSingleExit(
    entry: ElementEntry,
    delay: number,
    direction: TransitionDirection,
    config: ExitConfig
  ): Promise<void> {
    const { element, id } = entry;

    this.stopTransition(id);

    const transforms = this.getExitTransforms(direction, config);

    // Si keepSpace es false, preparar colapso
    if (!config.keepSpace) {
      const parent = element.parentElement;
      if (parent) {
        parent.style.minHeight = `${element.offsetHeight}px`;
      }
    }

    return new Promise((resolve) => {
      const animation = anime({
        targets: element,
        opacity: [1, config.finalOpacity ?? 0],
        translateX: transforms.translateX,
        translateY: transforms.translateY,
        scale: [1, config.finalScale ?? 1],
        filter: config.finalBlur ? [`blur(0px)`, `blur(${config.finalBlur}px)`] : undefined,
        duration: config.duration,
        easing: config.easing,
        delay,
        begin: () => {
          element.style.willChange = 'transform, opacity';
          if (config.finalBlur) {
            element.style.willChange += ', filter';
          }
        },
        complete: () => {
          // Ocultar elemento
          element.style.display = 'none';
          
          // Limpiar estilos
          element.style.transform = '';
          element.style.opacity = '';
          element.style.filter = '';
          element.style.willChange = '';

          // Limpiar min-height del padre
          if (!config.keepSpace) {
            const parent = element.parentElement;
            if (parent) {
              parent.style.minHeight = '';
            }
          }

          this.activeTransitions.delete(id);
          resolve();
        },
      });

      this.activeTransitions.set(id, { element, animation, type: 'exit' });
    });
  }

  /**
   * Calcula transforms para entrada
   */
  private getEnterTransforms(direction: TransitionDirection, config: EnterConfig) {
    const { distance = 30 } = config;
    const directionTracker = getDirectionTracker();
    const vector = directionTracker.calculateDisplacementVector(direction, distance);

    return {
      initial: `translate(${-vector.x}px, ${-vector.y}px) scale(${config.initialScale ?? 0.9})`,
      translateX: [-vector.x, 0],
      translateY: [-vector.y, 0],
    };
  }

  /**
   * Calcula transforms para salida
   */
  private getExitTransforms(direction: TransitionDirection, config: ExitConfig) {
    const { distance = 30 } = config;
    const directionTracker = getDirectionTracker();
    const vector = directionTracker.calculateDisplacementVector(direction, distance);

    return {
      translateX: [0, vector.x],
      translateY: [0, vector.y],
    };
  }

  /**
   * Calcula delays de stagger para un grupo
   */
  private calculateStaggerDelays(
    elements: ElementEntry[],
    groupConfig: TransitionGroupConfig | undefined,
    reverse: boolean = false
  ): Map<string, number> {
    const delays = new Map<string, number>();
    
    if (!groupConfig) {
      // Stagger simple
      elements.forEach((el, index) => {
        const order = reverse ? elements.length - 1 - index : index;
        delays.set(el.id, order * 50);
      });
      return delays;
    }

    const baseDelay = groupConfig.staggerDelay ?? 50;
    const maxDelay = groupConfig.maxStaggerDelay ?? 500;

    switch (groupConfig.staggerType) {
      case 'equal':
        elements.forEach((el, index) => {
          const order = groupConfig.staggerDirection === 'reverse' 
            ? elements.length - 1 - index 
            : index;
          const progress = order / (elements.length - 1 || 1);
          delays.set(el.id, progress * maxDelay);
        });
        break;

      case 'start':
        elements.forEach((el, index) => {
          const order = reverse ? elements.length - 1 - index : index;
          delays.set(el.id, Math.min(order * baseDelay, maxDelay));
        });
        break;

      case 'end':
        elements.forEach((el, index) => {
          const order = reverse ? index : elements.length - 1 - index;
          delays.set(el.id, Math.min(order * baseDelay, maxDelay));
        });
        break;

      case 'center':
        const centerIndex = elements.length / 2;
        elements.forEach((el, index) => {
          const distanceFromCenter = Math.abs(index - centerIndex);
          delays.set(el.id, Math.min(distanceFromCenter * baseDelay, maxDelay));
        });
        break;

      default:
        elements.forEach((el, index) => {
          delays.set(el.id, index * baseDelay);
        });
    }

    return delays;
  }

  /**
   * Coordina direcciones para un grupo coherente
   */
  private coordinateDirections(
    elements: ElementEntry[],
    type: 'enter' | 'exit'
  ): Map<string, TransitionDirection> {
    const directions = new Map<string, TransitionDirection>();

    if (elements.length === 0) return directions;

    // Para grupos pequeños, usar dirección base para todos
    if (elements.length <= 3) {
      const baseDirection: TransitionDirection = type === 'enter' ? 'bottom' : 'top';
      elements.forEach(el => directions.set(el.id, baseDirection));
      return directions;
    }

    // Para grupos grandes, crear efecto de "ventilador"
    const centerX = window.innerWidth / 2;

    elements.forEach(el => {
      const rect = el.element.getBoundingClientRect();
      const elCenterX = rect.left + rect.width / 2;
      
      if (elCenterX < centerX - 100) {
        directions.set(el.id, type === 'enter' ? 'left' : 'left');
      } else if (elCenterX > centerX + 100) {
        directions.set(el.id, type === 'enter' ? 'right' : 'right');
      } else {
        directions.set(el.id, type === 'enter' ? 'bottom' : 'top');
      }
    });

    return directions;
  }

  /**
   * Detiene una transición activa
   */
  private stopTransition(id: string): void {
    const transition = this.activeTransitions.get(id);
    if (transition) {
      transition.animation.pause();
      this.activeTransitions.delete(id);
    }
  }

  /**
   * Procesa la cola de operaciones
   */
  private processQueue(): void {
    if (this.queue.length > 0 && !this.isProcessing) {
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  /**
   * Limpia todas las transiciones activas
   */
  clearAll(): void {
    for (const [id] of this.activeTransitions) {
      this.stopTransition(id);
    }
    this.activeTransitions.clear();
    this.queue = [];
    this.isProcessing = false;
  }
}

// ============================================================================
// Instancia Singleton
// ============================================================================

let globalCoordinator: EnterExitCoordinator | null = null;

export function getEnterExitCoordinator(): EnterExitCoordinator {
  if (!globalCoordinator) {
    globalCoordinator = new EnterExitCoordinator();
  }
  return globalCoordinator;
}

export function destroyEnterExitCoordinator(): void {
  if (globalCoordinator) {
    globalCoordinator.clearAll();
    globalCoordinator = null;
  }
}
