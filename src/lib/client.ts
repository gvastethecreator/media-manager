/**
 * @file Cliente para operaciones del lado del cliente
 * @module lib/client
 */

export * from './contexts';
export * from './hooks';
// Re-exportar utilidades del cliente
export * from './utils';

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

import React from 'react';
