/**
 * @file Hook useEnterExit
 * @module hooks/transitions/use-enter-exit
 * @description Hook React para animaciones de entrada y salida coordinadas
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getEnterExitCoordinator } from '@/lib/transitions/core/enter-exit-coordinator';
import type { EnterConfig, ExitConfig, TransitionDirection } from '@/lib/transitions/types';

interface UseEnterExitOptions {
	/** ID único */
	id: string;
	/** Si está visible (controlado) */
	isVisible?: boolean;
	/** Configuración de entrada */
	enterConfig?: EnterConfig;
	/** Configuración de salida */
	exitConfig?: ExitConfig;
	/** Si está habilitado */
	enabled?: boolean;
	/** Grupo para coordinación */
	group?: string;
	/** Callbacks */
	onEnterStart?: () => void;
	onEnterComplete?: () => void;
	onExitStart?: () => void;
	onExitComplete?: () => void;
}

interface UseEnterExitReturn {
	/** Ref para asignar al elemento */
	ref: React.RefObject<HTMLElement | null>;
	/** Estado actual de visibilidad */
	isVisible: boolean;
	/** Estado de transición */
	isTransitioning: boolean;
	/** Muestra el elemento con animación */
	enter: (direction?: TransitionDirection) => Promise<void>;
	/** Oculta el elemento con animación */
	exit: (direction?: TransitionDirection) => Promise<void>;
	/** Toggle visibilidad */
	toggle: () => Promise<void>;
}

/**
 * Hook para animaciones de entrada y salida
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, isVisible, toggle } = useEnterExit({
 *     id: 'my-element',
 *     enterConfig: { type: 'slide', direction: 'bottom' },
 *     exitConfig: { type: 'slide', direction: 'top' },
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={toggle}>Toggle</button>
 *       {isVisible && <div ref={ref}>Contenido</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useEnterExit(options: UseEnterExitOptions): UseEnterExitReturn {
	const {
		id,
		isVisible: controlledVisible,
		enterConfig,
		exitConfig,
		enabled = true,
		group,
		onEnterStart,
		onEnterComplete,
		onExitStart,
		onExitComplete,
	} = options;

	const ref = useRef<HTMLElement>(null);
	const coordinator = useRef(getEnterExitCoordinator());
	const [isVisible, setIsVisible] = useState(controlledVisible ?? true);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const isControlled = controlledVisible !== undefined;
	const performEnterRef = useRef<(direction?: TransitionDirection) => Promise<void>>(async () => {});
	const performExitRef = useRef<(direction?: TransitionDirection) => Promise<void>>(async () => {});

	/**
	 * Ejecuta animación de entrada
	 */
	const performEnter = useCallback(
		async (direction?: TransitionDirection): Promise<void> => {
			if (!(enabled && ref.current)) {
				setIsVisible(true);
				return;
			}

			setIsTransitioning(true);
			onEnterStart?.();

			const config = direction ? { ...enterConfig, direction } : enterConfig;

			try {
				await coordinator.current.coordinateEnter(
					[
						{
							id,
							element: ref.current,
							index: 0,
							group,
							config: { enter: config },
						},
					],
					config
				);
				setIsVisible(true);
				onEnterComplete?.();
			} finally {
				setIsTransitioning(false);
			}
		},
		[enabled, id, group, enterConfig, onEnterStart, onEnterComplete]
	);

	/**
	 * Ejecuta animación de salida
	 */
	const performExit = useCallback(
		async (direction?: TransitionDirection): Promise<void> => {
			if (!(enabled && ref.current)) {
				setIsVisible(false);
				return;
			}

			setIsTransitioning(true);
			onExitStart?.();

			const config = direction ? { ...exitConfig, direction } : exitConfig;

			try {
				await coordinator.current.coordinateExit(
					[
						{
							id,
							element: ref.current,
							index: 0,
							group,
							config: { exit: config },
						},
					],
					config
				);
				setIsVisible(false);
				onExitComplete?.();
			} finally {
				setIsTransitioning(false);
			}
		},
		[enabled, id, group, exitConfig, onExitStart, onExitComplete]
	);

	/**
	 * Toggle visibilidad
	 */
	const toggle = useCallback(async (): Promise<void> => {
		if (isVisible) {
			await performExit();
		} else {
			await performEnter();
		}
	}, [isVisible, performEnter, performExit]);

	return {
		ref: ref as React.RefObject<HTMLElement | null>,
		isVisible,
		isTransitioning,
		enter: performEnter,
		exit: performExit,
		toggle,
	};
}

// ============================================================================
// Hook para grupos de elementos
// ============================================================================

interface GroupElement {
	id: string;
	ref: React.RefObject<HTMLElement | null>;
	index: number;
	config?: { enter?: EnterConfig; exit?: ExitConfig };
}

interface UseEnterExitGroupOptions {
	groupId: string;
	enabled?: boolean;
	globalEnterConfig?: EnterConfig;
	globalExitConfig?: ExitConfig;
}

interface UseEnterExitGroupReturn {
	registerElement: (
		id: string,
		index: number,
		config?: { enter?: EnterConfig; exit?: ExitConfig }
	) => {
		ref: React.RefObject<HTMLElement | null>;
		id: string;
	};
	enterAll: (direction?: TransitionDirection) => Promise<void>;
	exitAll: (direction?: TransitionDirection) => Promise<void>;
	isTransitioning: boolean;
}

/**
 * Hook para coordinar entrada/salida de múltiples elementos
 */
export function useEnterExitGroup(options: UseEnterExitGroupOptions): UseEnterExitGroupReturn {
	const { groupId, enabled = true, globalEnterConfig, globalExitConfig } = options;
	const coordinator = useRef(getEnterExitCoordinator());
	const elements = useRef<Map<string, GroupElement>>(new Map());
	const [isTransitioning, setIsTransitioning] = useState(false);

	// Registrar grupo
	useEffect(() => {
		coordinator.current.registerGroup({
			id: groupId,
			staggerDelay: 50,
			maxStaggerDelay: 500,
			staggerType: 'start',
		});

		return () => {
			coordinator.current.unregisterGroup(groupId);
		};
	}, [groupId]);

	/**
	 * Registra un elemento en el grupo
	 */
	const registerElement = useCallback(
		(id: string, index: number, config?: { enter?: EnterConfig; exit?: ExitConfig }) => {
			const ref = { current: null as HTMLElement | null };

			elements.current.set(id, {
				id,
				ref: ref as React.RefObject<HTMLElement | null>,
				index,
				config,
			});

			return { ref: ref as React.RefObject<HTMLElement | null>, id };
		},
		[]
	);

	/**
	 * Anima entrada de todos los elementos
	 */
	const enterAll = useCallback(
		async (direction?: TransitionDirection): Promise<void> => {
			if (!enabled) return;

			setIsTransitioning(true);

			const elementEntries = Array.from(elements.current.values())
				.filter((el) => el.ref.current)
				.map((el) => ({
					id: el.id,
					element: el.ref.current!,
					index: el.index,
					group: groupId,
					config: {
						enter: direction ? { ...globalEnterConfig, direction } : globalEnterConfig,
						...el.config,
					},
				}));

			try {
				await coordinator.current.coordinateEnter(elementEntries, globalEnterConfig);
			} finally {
				setIsTransitioning(false);
			}
		},
		[enabled, groupId, globalEnterConfig]
	);

	/**
	 * Anima salida de todos los elementos
	 */
	const exitAll = useCallback(
		async (direction?: TransitionDirection): Promise<void> => {
			if (!enabled) return;

			setIsTransitioning(true);

			const elementEntries = Array.from(elements.current.values())
				.filter((el) => el.ref.current)
				.map((el) => ({
					id: el.id,
					element: el.ref.current!,
					index: el.index,
					group: groupId,
					config: {
						exit: direction ? { ...globalExitConfig, direction } : globalExitConfig,
						...el.config,
					},
				}));

			try {
				await coordinator.current.coordinateExit(elementEntries, globalExitConfig);
			} finally {
				setIsTransitioning(false);
			}
		},
		[enabled, groupId, globalExitConfig]
	);

	return {
		registerElement,
		enterAll,
		exitAll,
		isTransitioning,
	};
}
