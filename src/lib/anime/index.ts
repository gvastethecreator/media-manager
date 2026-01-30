/**
 * @file Wrapper y exportaciones de anime.js
 * @module lib/anime
 * @description Exportación tipada y configurada de anime.js para el proyecto
 */

import anime from 'animejs';
import type { AnimeInstance, AnimeParams, AnimeTimelineInstance } from 'animejs';

// Re-exportar anime como default y named export
export { anime };
export default anime;

// Re-exportar tipos
export type { AnimeInstance, AnimeParams, AnimeTimelineInstance };

/**
 * Crea una línea de tiempo de animación
 */
export function createTimeline(params?: AnimeParams): AnimeTimelineInstance {
  return anime.timeline(params);
}

/**
 * Anima un conjunto de elementos con stagger
 */
export function stagger(
  elements: string | NodeList | HTMLElement[],
  params: AnimeParams & { stagger?: number | ((el: HTMLElement, i: number) => number) }
): AnimeInstance {
  return anime({
    targets: elements,
    ...params,
  });
}

/**
 * Utilidad para crear una animación que se puede reproducir/pausar
 */
export function createControllableAnimation(params: AnimeParams): {
  play: () => void;
  pause: () => void;
  restart: () => void;
  reverse: () => void;
  seek: (progress: number) => void;
  instance: AnimeInstance;
} {
  const instance = anime({
    autoplay: false,
    ...params,
  });

  return {
    play: () => instance.play(),
    pause: () => instance.pause(),
    restart: () => instance.restart(),
    reverse: () => instance.reverse(),
    seek: (progress: number) => instance.seek(progress),
    instance,
  };
}

/**
 * Utilidad para animar propiedades CSS personalizadas
 */
export function animateCSSProperty(
  element: HTMLElement,
  property: string,
  from: string | number,
  to: string | number,
  duration: number = 300,
  easing: string = 'easeOutQuad'
): AnimeInstance {
  return anime({
    targets: element,
    [property]: [from, to],
    duration,
    easing,
  });
}

/**
 * Utilidad para animar múltiples elementos con delays escalonados
 */
export function animateStaggered(
  elements: string | NodeList | HTMLElement[],
  animationParams: Omit<AnimeParams, 'targets' | 'delay'>,
  staggerAmount: number = 100,
  staggerFrom: 'first' | 'last' | 'center' | number = 'first'
): AnimeInstance {
  let delayFn: (el: HTMLElement, i: number, l: number) => number;

  switch (staggerFrom) {
    case 'first':
      delayFn = (_, i) => i * staggerAmount;
      break;
    case 'last':
      delayFn = (_, i, l) => (l - 1 - i) * staggerAmount;
      break;
    case 'center':
      delayFn = (_, i, l) => Math.abs(i - (l - 1) / 2) * staggerAmount;
      break;
    default:
      delayFn = (_, i) => Math.abs(i - staggerFrom) * staggerAmount;
  }

  return anime({
    targets: elements,
    ...animationParams,
    delay: delayFn,
  });
}
