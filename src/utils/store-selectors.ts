/**
 * @file Utilidad para crear selectores de tiendas Zustand
 * @module utils/store-selectors
 * @description Este archivo existe para mantener compatibilidad con importaciones antiguas.
 * Se debe migrar a usar @/utils/store/create-selectors.ts directamente en el futuro.
 * @deprecated Use @/utils/store/create-selectors.ts instead
 */

import { createSelectors as create } from './store/create-selectors';

/**
 * Crea selectores para una tienda Zustand, permitiendo acceder a
 * propiedades individuales sin causar re-renderizados innecesarios
 * cuando otras propiedades cambian.
 *
 * @param store La tienda Zustand para la que crear selectores
 * @returns Una versión de la tienda con selectores automáticos
 * @deprecated Use @/utils/store/create-selectors.ts instead
 */
export const createSelectors = create;

// Re-exportación para mantener compatibilidad
export default createSelectors;
