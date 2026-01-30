/**
 * @file Hook useEntityCardTransition
 * @module hooks/transitions/use-entity-card-transition
 * @description Hook especializado para transiciones en tarjetas de entidades
 *
 * Integra FLIP, enter/exit y morphing para tarjetas de carpetas, imágenes, etc.
 */

import { useCallback, useRef, useState } from 'react';
import type { EnterConfig, ExitConfig } from '@/lib/transitions';
import { getEnterExitCoordinator, getFlipEngine } from '@/lib/transitions';

interface UseEntityCardTransitionOptions {
	/** ID de la entidad */
	entityId: string;
	/** Tipo de entidad */
	entityType: 'folder' | 'image' | 'video' | 'audio' | 'document' | 'tag' | 'character' | 'collection' | 'album';
	/** Si está seleccionada */
	isSelected?: boolean;
	/** Si está expandida (vista detalle) */
	isExpanded?: boolean;
	/** Si está habilitada la transición */
	enabled?: boolean;
}

interface UseEntityCardTransitionReturn {
	/** Ref para la tarjeta */
	cardRef: React.RefObject<HTMLDivElement | null>;
	/** Ref para la imagen/ícono (elemento compartido) */
	mediaRef: React.RefObject<HTMLElement | null>;
	/** Ejecuta transición al hacer click */
	handleCardClick: (callback: () => void) => Promise<void>;
	/** Ejecuta transición de selección */
	handleSelectionChange: (selected: boolean) => Promise<void>;
	/** Ejecuta transición de expansión */
	handleExpandChange: (expanded: boolean) => Promise<void>;
	/** Estado de transición */
	isTransitioning: boolean;
	/** Clases CSS para el estado actual */
	transitionClasses: string;
}

/**
 * Hook para transiciones en tarjetas de entidades
 *
 * @example
 * ```tsx
 * function FolderCard({ folder, onClick }) {
 *   const { cardRef, handleCardClick, isTransitioning, transitionClasses } =
 *     useEntityCardTransition({
 *       entityId: folder.id,
 *       entityType: 'folder',
 *     });
 *
 *   const handleClick = () => {
 *     handleCardClick(() => onClick(folder));
 *   };
 *
 *   return (
 *     <div
 *       ref={cardRef}
 *       className={cn("card", transitionClasses)}
 *       onClick={handleClick}
 *     >
 *       <img src={folder.thumbnail} alt="" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useEntityCardTransition(options: UseEntityCardTransitionOptions): UseEntityCardTransitionReturn {
	const { entityId, entityType, isSelected, isExpanded, enabled = true } = options;

	const cardRef = useRef<HTMLDivElement>(null);
	const mediaRef = useRef<HTMLElement>(null);
	const flipEngine = useRef(getFlipEngine());
	const coordinator = useRef(getEnterExitCoordinator());
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [transitionState, setTransitionState] = useState<'idle' | 'entering' | 'exiting' | 'morphing'>('idle');

	// Configuraciones según tipo de entidad
	const getEntityConfig = () => {
		const configs: Record<string, { enter: EnterConfig; exit: ExitConfig }> = {
			folder: {
				enter: {
					type: 'slide',
					direction: 'bottom',
					distance: 20,
					duration: 350,
					easing: 'easeOutExpo',
				},
				exit: {
					type: 'scale',
					direction: 'center',
					finalScale: 0.9,
					duration: 250,
					easing: 'easeInExpo',
				},
			},
			image: {
				enter: {
					type: 'scale',
					direction: 'center',
					initialScale: 0.85,
					duration: 400,
					easing: 'easeOutExpo',
				},
				exit: {
					type: 'blur',
					finalBlur: 10,
					duration: 300,
					easing: 'easeInQuad',
				},
			},
			video: {
				enter: {
					type: 'slide',
					direction: 'right',
					distance: 30,
					duration: 450,
					easing: 'easeOutExpo',
				},
				exit: {
					type: 'slide',
					direction: 'left',
					distance: 30,
					duration: 350,
					easing: 'easeInExpo',
				},
			},
			audio: {
				enter: {
					type: 'slide',
					direction: 'bottom',
					distance: 15,
					duration: 300,
					easing: 'easeOutQuad',
				},
				exit: {
					type: 'scale',
					finalScale: 0.95,
					duration: 200,
					easing: 'easeInQuad',
				},
			},
			document: {
				enter: {
					type: 'slide',
					direction: 'right',
					distance: 20,
					duration: 350,
					easing: 'easeOutExpo',
				},
				exit: {
					type: 'slide',
					direction: 'right',
					distance: 20,
					duration: 250,
					easing: 'easeInExpo',
				},
			},
			tag: {
				enter: {
					type: 'scale',
					initialScale: 0.8,
					duration: 250,
					easing: 'easeOutBack',
				},
				exit: {
					type: 'scale',
					finalScale: 0.8,
					duration: 200,
					easing: 'easeInBack',
				},
			},
			character: {
				enter: {
					type: 'slide',
					direction: 'bottom',
					distance: 25,
					duration: 400,
					easing: 'easeOutExpo',
				},
				exit: {
					type: 'scale',
					finalScale: 0.9,
					duration: 300,
					easing: 'easeInExpo',
				},
			},
			collection: {
				enter: {
					type: 'scale',
					initialScale: 0.85,
					duration: 400,
					easing: 'easeOutExpo',
				},
				exit: {
					type: 'slide',
					direction: 'bottom',
					distance: 20,
					duration: 300,
					easing: 'easeInExpo',
				},
			},
			album: {
				enter: {
					type: 'slide',
					direction: 'bottom',
					distance: 20,
					duration: 350,
					easing: 'easeOutExpo',
				},
				exit: {
					type: 'scale',
					finalScale: 0.9,
					duration: 250,
					easing: 'easeInExpo',
				},
			},
		};

		return configs[entityType] || configs.folder;
	};

	/**
	 * Maneja el click en la tarjeta con transición FLIP
	 */
	const handleCardClick = useCallback(
		async (callback: () => void): Promise<void> => {
			if (!(enabled && cardRef.current)) {
				callback();
				return;
			}

			setIsTransitioning(true);
			setTransitionState('morphing');

			try {
				// Registrar elemento en FLIP
				flipEngine.current.register({
					id: `card-${entityId}`,
					element: cardRef.current,
					options: {
						duration: 400,
						easing: 'easeOutExpo',
					},
				});

				// Ejecutar FLIP
				await flipEngine.current.execute(() => {
					callback();
				}, [`card-${entityId}`]);

				// Limpiar
				flipEngine.current.unregister(`card-${entityId}`);
			} finally {
				setIsTransitioning(false);
				setTransitionState('idle');
			}
		},
		[enabled, entityId]
	);

	/**
	 * Maneja cambio de selección
	 */
	const handleSelectionChange = useCallback(
		async (selected: boolean): Promise<void> => {
			if (!(enabled && cardRef.current)) return;

			setIsTransitioning(true);
			setTransitionState(selected ? 'entering' : 'exiting');

			const config = getEntityConfig();

			try {
				if (selected) {
					await coordinator.current.coordinateEnter(
						[
							{
								id: `select-${entityId}`,
								element: cardRef.current,
								index: 0,
							},
						],
						config.enter
					);
				} else {
					await coordinator.current.coordinateExit(
						[
							{
								id: `select-${entityId}`,
								element: cardRef.current,
								index: 0,
							},
						],
						config.exit
					);
				}
			} finally {
				setIsTransitioning(false);
				setTransitionState('idle');
			}
		},
		[enabled, entityId, getEntityConfig]
	);

	/**
	 * Maneja cambio de expansión
	 */
	const handleExpandChange = useCallback(
		async (expanded: boolean): Promise<void> => {
			if (!(enabled && cardRef.current)) return;

			setIsTransitioning(true);
			setTransitionState(expanded ? 'entering' : 'exiting');

			try {
				if (expanded) {
					// Animación de expansión
					await coordinator.current.coordinateEnter(
						[
							{
								id: `expand-${entityId}`,
								element: cardRef.current,
								index: 0,
							},
						],
						{
							type: 'scale',
							direction: 'center',
							initialScale: 0.9,
							duration: 400,
							easing: 'easeOutExpo',
						}
					);
				} else {
					// Animación de contracción
					await coordinator.current.coordinateExit(
						[
							{
								id: `expand-${entityId}`,
								element: cardRef.current,
								index: 0,
							},
						],
						{
							type: 'scale',
							direction: 'center',
							finalScale: 0.95,
							duration: 300,
							easing: 'easeInExpo',
						}
					);
				}
			} finally {
				setIsTransitioning(false);
				setTransitionState('idle');
			}
		},
		[enabled, entityId]
	);

	// Generar clases CSS según estado
	const transitionClasses = [
		isTransitioning && 'transition-active',
		transitionState === 'entering' && 'transition-entering',
		transitionState === 'exiting' && 'transition-exiting',
		transitionState === 'morphing' && 'transition-morphing',
		isSelected && 'transition-selected',
		isExpanded && 'transition-expanded',
	]
		.filter(Boolean)
		.join(' ');

	return {
		cardRef,
		mediaRef: mediaRef as React.RefObject<HTMLElement | null>,
		handleCardClick,
		handleSelectionChange,
		handleExpandChange,
		isTransitioning,
		transitionClasses,
	};
}

/**
 * Hook para animar un grupo de tarjetas
 */
export function useEntityCardGroupTransition(options: { groupId: string; enabled?: boolean; staggerDelay?: number }): {
	registerCard: (id: string, index: number) => React.RefObject<HTMLDivElement | null>;
	animateEnter: () => Promise<void>;
	animateExit: () => Promise<void>;
	isAnimating: boolean;
} {
	const { groupId, enabled = true, staggerDelay = 50 } = options;
	const coordinator = useRef(getEnterExitCoordinator());
	const cards = useRef<Map<string, { ref: React.RefObject<HTMLDivElement | null>; index: number }>>(new Map());
	const [isAnimating, setIsAnimating] = useState(false);

	// Registrar grupo
	const registerCard = useCallback((id: string, index: number) => {
		const ref = { current: null as HTMLDivElement | null };
		cards.current.set(id, { ref, index });
		return ref;
	}, []);

	const animateEnter = useCallback(async () => {
		if (!enabled) return;

		setIsAnimating(true);

		const elements = Array.from(cards.current.entries())
			.filter(([, data]) => data.ref.current)
			.map(([id, data]) => ({
				id,
				element: data.ref.current!,
				index: data.index,
				group: groupId,
			}));

		coordinator.current.registerGroup({
			id: groupId,
			staggerDelay,
			staggerType: 'start',
		});

		await coordinator.current.coordinateEnter(elements, {
			type: 'slide',
			direction: 'bottom',
			distance: 20,
			duration: 400,
			easing: 'easeOutExpo',
		});

		setIsAnimating(false);
	}, [enabled, groupId, staggerDelay]);

	const animateExit = useCallback(async () => {
		if (!enabled) return;

		setIsAnimating(true);

		const elements = Array.from(cards.current.entries())
			.filter(([, data]) => data.ref.current)
			.map(([id, data]) => ({
				id,
				element: data.ref.current!,
				index: data.index,
				group: groupId,
			}));

		await coordinator.current.coordinateExit(elements, {
			type: 'slide',
			direction: 'top',
			distance: 15,
			duration: 250,
			easing: 'easeInExpo',
		});

		setIsAnimating(false);
	}, [enabled, groupId]);

	return {
		registerCard,
		animateEnter,
		animateExit,
		isAnimating,
	};
}
