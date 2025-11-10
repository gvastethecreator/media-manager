import React from 'react';

/**
 * @file Cliente para operaciones del lado del cliente
 * @module lib/client
 */

export * from './contexts';
// Resolver conflicto de exportación duplicada de useSettings
export { useSettings } from './contexts/settings-context';
export * from './hooks';
// Nota: No re-exportamos './utils' para evitar colisiones con exports de nivel superior en src/lib/index.ts
// Las utilidades se exportan directamente desde @/lib/utils cuando se necesiten

// Cliente específico para el navegador
export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

/**
 * Ejecuta código solo en el cliente
 */
export function clientOnly<T>(fn: () => T): T | undefined {
	return isClient ? fn() : undefined;
}

/**
 * Hook para detectar si estamos en el cliente
 */
export function useIsClient(): boolean {
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	return mounted;
}
