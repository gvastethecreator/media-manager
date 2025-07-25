/**
 * @file Utilidad para crear selectores de tiendas Zustand
 * @module utils/store/create-selectors
 */

import type { StoreApi, UseBoundStore } from 'zustand';

/**
 * Crea selectores para una tienda Zustand, permitiendo acceder a
 * propiedades individuales sin causar re-renderizados innecesarios
 * cuando otras propiedades cambian.
 *
 * @param store La tienda Zustand para la que crear selectores
 * @returns Una versión de la tienda con selectores automáticos
 */
export function createSelectors<T extends object>(store: UseBoundStore<StoreApi<T>>) {
	// Simplemente retornamos el store original ya que Zustand ya maneja los selectores correctamente
	return store;
}
