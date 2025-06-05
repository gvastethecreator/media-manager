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
export function createSelectors<T extends object, A>(store: UseBoundStore<StoreApi<T & A>>) {
	// Creamos un proxy con getters para cada propiedad
	return new Proxy(store, {
		get(target, prop: PropertyKey) {
			// Si estamos accediendo a una propiedad existente del objeto store, retornarla
			if (prop in target) {
				return target[prop as keyof typeof target];
			}

			// En lugar de intentar usar hooks directamente, creamos una función segura
			// que utiliza el método getState directamente para evitar errores de hooks
			return (state: any) => {
				if (typeof prop !== 'string') {
					throw new Error(`Attempted to access property using non-string key: ${String(prop)}`);
				}

				// Si se proporciona un estado, usar ese estado; de lo contrario, obtener el estado actual
				const storeState = state || target.getState();
				return storeState[prop as keyof T & A];
			};
		},
	}) as typeof store & {
		[K in keyof T & A]: (state?: any) => T[K & keyof T] | A[K & keyof A];
	};
}
