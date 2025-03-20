'use client';

import { useCallback, useEffect, useRef } from 'react';

// Definimos un tipo genérico para los datos
export interface RenderDebugProps<T = unknown> {
	componentName: string;
	data: T;
	enabled?: boolean;
	maxRenders?: number;
	onMaxRenders?: () => void;
	compareKeys?: string[];
}

/**
 * Componente para depurar renderizados excesivos y cambios en datos
 *
 * @param componentName Nombre del componente a depurar
 * @param data Datos a monitorear
 * @param enabled Activar/desactivar la depuración
 * @param maxRenders Número máximo de renderizados permitidos
 * @param onMaxRenders Callback al superar el máximo de renderizados
 * @param compareKeys Claves específicas para comparar en los datos
 */
export function RenderDebug<T = unknown>({
	componentName,
	data,
	enabled = true,
	maxRenders = 50,
	onMaxRenders,
	compareKeys = []
}: RenderDebugProps<T>) {
	const renderCount = useRef(0);
	const prevDataRef = useRef<T | null>(null);
	const startTimeRef = useRef<number>(performance.now());
	const stopLoggingRef = useRef<boolean>(false);
	const seenRef = useRef(new Set<unknown>());
	const compareKeysRef = useRef(compareKeys);

	// Actualizar compareKeysRef si cambia
	useEffect(() => {
		compareKeysRef.current = compareKeys;
	}, [compareKeys]);

	// Función para serializar y comparar objetos de forma segura (estable entre renderizados)
	const safeStringify = useCallback((obj: unknown): string => {
		try {
			// Limpiar el Set de circularidades
			seenRef.current.clear();

			// Crear un nuevo objeto con solo las propiedades necesarias
			if (compareKeysRef.current.length > 0 && obj && typeof obj === 'object') {
				const filteredObj: Record<string, unknown> = {};

				// Usar for...of en lugar de forEach
				for (const key of compareKeysRef.current) {
					if (key.includes('.')) {
						// Manejar propiedades anidadas
						const parts = key.split('.');
						let current = obj as Record<string, unknown>;
						let valid = true;

						for (let i = 0; i < parts.length - 1; i++) {
							if (current && current[parts[i]] !== undefined) {
								current = current[parts[i]] as Record<string, unknown>;
							} else {
								valid = false;
								break;
							}
						}

						if (valid && current) {
							const lastPart = parts[parts.length - 1];
							filteredObj[key] = current[lastPart];
						}
					} else if (obj && typeof obj === 'object') {
						// Propiedades simples
						const typedObj = obj as Record<string, unknown>;
						filteredObj[key] = typedObj[key];
					}
				}
				return JSON.stringify(filteredObj);
			}

			// Intentar hacer una serialización directa con manejo de circularidades
			return JSON.stringify(obj, (key, value) => {
				// Evitar circularidades
				if (key && typeof value === 'object' && value !== null) {
					if (seenRef.current.has(value)) return '[Circular]';
					seenRef.current.add(value);
				}
				return value;
			});
		} catch (error) {
			return `[Error al serializar: ${error instanceof Error ? error.message : String(error)}]`;
		}
	}, []);

	// Detectar cambios en los datos
	useEffect(() => {
		if (!enabled || stopLoggingRef.current) return;

		renderCount.current++;
		const now = performance.now();
		const timeSinceStart = now - startTimeRef.current;

		// Detección de renderizados excesivos
		if (renderCount.current > maxRenders) {
			if (!stopLoggingRef.current) {
				console.error(
					`🔥 [${componentName}] ALERTA: Más de ${maxRenders} renderizados en ${timeSinceStart.toFixed(2)}ms! Posible bucle infinito.`,
					data
				);
				stopLoggingRef.current = true;
				onMaxRenders?.();
			}
			return;
		}

		// Solo registrar después del primer renderizado
		if (renderCount.current > 1) {
			const prevData = prevDataRef.current;
			const currentData = safeStringify(data);
			const prevDataStr = safeStringify(prevData);

			// Si los datos han cambiado, registrarlo
			if (prevDataStr !== currentData) {
				console.log(
					`🔄 [${componentName}] Renderizado #${renderCount.current} (${timeSinceStart.toFixed(2)}ms)`,
					'\nDatos anteriores:', prevData,
					'\nDatos nuevos:', data
				);
			} else {
				console.log(
					`⚠️ [${componentName}] Renderizado #${renderCount.current} sin cambios en datos (${timeSinceStart.toFixed(2)}ms)`
				);
			}
		}

		prevDataRef.current = typeof data === 'object' && data !== null ? { ...(data as Record<string, unknown>) } : data;
	}, [data, componentName, enabled, maxRenders, onMaxRenders, safeStringify]); // compareKeys ya no es una dependencia directa

	// No renderizar nada, es solo para depuración
	return null;
}

// Versión para envolver componentes enteros
export function withRenderDebug<P>(
	Component: React.ComponentType<P>,
	debugOptions: Omit<RenderDebugProps<unknown>, 'data' | 'componentName'> & {
		componentName?: string;
		dataSelector?: (props: P) => unknown;
	}
) {
	const {
		componentName = Component.displayName || Component.name || 'UnnamedComponent',
		dataSelector = (props) => props,
		...otherOptions
	} = debugOptions;

	const WrappedComponent = (props: P) => {
		const selectedData = dataSelector(props);

		return (
			<>
				<RenderDebug
					componentName={componentName}
					data={selectedData}
					{...otherOptions}
				/>
				<Component {...props} />
			</>
		);
	};

	WrappedComponent.displayName = `withRenderDebug(${componentName})`;
	return WrappedComponent;
}

// Versiones simplificadas para casos de uso comunes
export const createDebugger = (componentName: string, enabled = true) => {
	return {
		logRender: (data: unknown = {}) => {
			if (!enabled) return;
			console.log(`🔄 [${componentName}] Renderizado`, data);
		},
		logEffect: (effectName: string, deps: unknown[] = []) => {
			if (!enabled) return;
			console.log(`🔄 [${componentName}] Efecto "${effectName}" ejecutado`, deps);
		},
		logProps: (props: unknown) => {
			if (!enabled) return;
			console.log(`🔄 [${componentName}] Props`, props);
		},
		logState: (stateName: string, value: unknown) => {
			if (!enabled) return;
			console.log(`🔄 [${componentName}] Estado "${stateName}"`, value);
		}
	};
};