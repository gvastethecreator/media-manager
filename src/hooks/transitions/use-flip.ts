/**
 * @file Hook useFlip
 * @module hooks/transitions/use-flip
 * @description Hook React para utilizar el motor FLIP de transiciones
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getFlipEngine } from '@/lib/transitions/core/flip-engine';
import type { FlipOptions } from '@/lib/transitions/types';

interface UseFlipOptions {
	/** ID único para el elemento FLIP */
	id: string;
	/** Si está habilitado */
	enabled?: boolean;
	/** Opciones de animación */
	options?: FlipOptions;
	/** Dependencias para reiniciar */
	deps?: React.DependencyList;
}

interface UseFlipReturn {
	/** Ref para asignar al elemento */
	ref: React.RefObject<HTMLElement | null>;
	/** Ejecuta el ciclo FLIP manualmente */
	executeFlip: (changeCallback: () => void) => Promise<void>;
	/** Captura estado FIRST */
	captureFirst: () => void;
	/** Captura estado LAST y ejecuta PLAY */
	captureLastAndPlay: () => Promise<void>;
	/** Si está en transición */
	isTransitioning: boolean;
}

/**
 * Hook para utilizar transiciones FLIP en un elemento
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, executeFlip } = useFlip({ id: 'my-card' });
 *   const [expanded, setExpanded] = useState(false);
 *
 *   const handleToggle = () => {
 *     executeFlip(() => {
 *       setExpanded(!expanded);
 *     });
 *   };
 *
 *   return (
 *     <div ref={ref} onClick={handleToggle}>
 *       Contenido
 *     </div>
 *   );
 * }
 * ```
 */
export function useFlip(options: UseFlipOptions): UseFlipReturn {
	const { id, enabled = true, options: flipOptions, deps = [] } = options;
	const ref = useRef<HTMLElement>(null);
	const engine = useRef(getFlipEngine());
	const [isTransitioning, setIsTransitioning] = useState(false);

	// Registrar elemento en el motor
	useEffect(() => {
		if (!(enabled && ref.current)) return;

		const element = ref.current;
		engine.current.register({
			id,
			element,
			options: flipOptions,
		});

		return () => {
			engine.current.unregister(id);
		};
	}, [id, enabled, ...deps, flipOptions]);

	// Actualizar opciones si cambian
	useEffect(() => {
		if (!(enabled && ref.current)) return;

		// Re-registrar con nuevas opciones
		engine.current.unregister(id);
		engine.current.register({
			id,
			element: ref.current,
			options: flipOptions,
		});
	}, [flipOptions, enabled, id]);

	/**
	 * Ejecuta el ciclo completo FLIP
	 */
	const executeFlip = useCallback(
		async (changeCallback: () => void): Promise<void> => {
			if (!(enabled && ref.current)) {
				changeCallback();
				return;
			}

			setIsTransitioning(true);

			try {
				await engine.current.execute(() => {
					changeCallback();
				}, [id]);
			} finally {
				setIsTransitioning(false);
			}
		},
		[id, enabled]
	);

	/**
	 * Captura estado FIRST
	 */
	const captureFirst = useCallback((): void => {
		if (!enabled) return;
		engine.current.captureFirst();
	}, [enabled]);

	/**
	 * Captura estado LAST y ejecuta animación
	 */
	const captureLastAndPlay = useCallback(async (): Promise<void> => {
		if (!enabled) return;

		setIsTransitioning(true);
		try {
			engine.current.captureLast();
			await engine.current.play();
		} finally {
			setIsTransitioning(false);
		}
	}, [enabled]);

	return {
		ref: ref as React.RefObject<HTMLElement | null>,
		executeFlip,
		captureFirst,
		captureLastAndPlay,
		isTransitioning,
	};
}

/**
 * Hook para múltiples elementos FLIP
 */
export function useFlipGroup(options: { ids: string[]; enabled?: boolean; options?: FlipOptions }): {
	registerRef: (id: string) => (el: HTMLElement | null) => void;
	executeFlip: (changeCallback: () => void) => Promise<void>;
	isTransitioning: boolean;
} {
	const { ids, enabled = true, options: flipOptions } = options;
	const engine = useRef(getFlipEngine());
	const refs = useRef<Map<string, HTMLElement>>(new Map());
	const [isTransitioning, setIsTransitioning] = useState(false);

	// Registrar todos los elementos
	useEffect(() => {
		if (!enabled) return;

		for (const [id, element] of refs.current) {
			if (element) {
				engine.current.register({
					id,
					element,
					options: flipOptions,
				});
			}
		}

		return () => {
			for (const id of ids) {
				engine.current.unregister(id);
			}
		};
	}, [ids, enabled, flipOptions]);

	/**
	 * Crea una función ref para registrar elementos
	 */
	const registerRef = useCallback(
		(id: string) => {
			return (el: HTMLElement | null) => {
				if (el) {
					refs.current.set(id, el);
					if (enabled) {
						engine.current.register({
							id,
							element: el,
							options: flipOptions,
						});
					}
				} else {
					refs.current.delete(id);
					engine.current.unregister(id);
				}
			};
		},
		[enabled, flipOptions]
	);

	/**
	 * Ejecuta FLIP para todos los elementos registrados
	 */
	const executeFlip = useCallback(
		async (changeCallback: () => void): Promise<void> => {
			if (!enabled) {
				changeCallback();
				return;
			}

			setIsTransitioning(true);
			try {
				await engine.current.execute(changeCallback);
			} finally {
				setIsTransitioning(false);
			}
		},
		[enabled]
	);

	return {
		registerRef,
		executeFlip,
		isTransitioning,
	};
}
