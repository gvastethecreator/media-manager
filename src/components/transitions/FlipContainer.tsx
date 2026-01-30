/**
 * @file Componente FlipContainer
 * @module components/transitions/FlipContainer
 * @description Contenedor que aplica transiciones FLIP automáticamente
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { FlipOptions } from '@/lib/transitions';
import { getFlipEngine } from '@/lib/transitions';
import { cn } from '@/lib/utils';

interface FlipContainerProps {
	/** ID único del contenedor */
	flipId: string;
	/** Contenido */
	children: React.ReactNode;
	/** Clases CSS adicionales */
	className?: string;
	/** Si las transiciones están habilitadas */
	enabled?: boolean;
	/** Opciones de animación FLIP */
	options?: FlipOptions;
	/** Si debe animar en el primer render */
	animateOnMount?: boolean;
	/** Callback cuando inicia la transición */
	onFlipStart?: () => void;
	/** Callback cuando completa la transición */
	onFlipComplete?: () => void;
	/** Handler de click */
	onClick?: () => void;
	/** Handler de doble click */
	onDoubleClick?: () => void;
	/** Estilos inline */
	style?: React.CSSProperties;
}

/**
 * Componente que envuelve un elemento y le aplica transiciones FLIP
 *
 * @example
 * ```tsx
 * <FlipContainer flipId="card-1" enabled={true}>
 *   <div className="p-4 bg-card">
 *     <h2>Título</h2>
 *     <p>Contenido</p>
 *   </div>
 * </FlipContainer>
 * ```
 */
export const FlipContainer = React.memo(function FlipContainer({
	flipId,
	children,
	className,
	enabled = true,
	options,
	animateOnMount = false,
	onFlipStart,
	onFlipComplete,
	onClick,
	onDoubleClick,
	style,
}: FlipContainerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const engine = useRef(getFlipEngine());
	const [isTransitioning, setIsTransitioning] = useState(false);
	const isFirstRender = useRef(true);

	// Registrar en el motor FLIP
	useEffect(() => {
		if (!(enabled && containerRef.current)) return;

		const element = containerRef.current;

		engine.current.register({
			id: flipId,
			element,
			options: {
				...options,
				onStart: () => {
					setIsTransitioning(true);
					onFlipStart?.();
				},
				onComplete: () => {
					setIsTransitioning(false);
					onFlipComplete?.();
				},
			},
		});

		return () => {
			engine.current.unregister(flipId);
		};
	}, [flipId, enabled, options, onFlipStart, onFlipComplete]);

	// Capturar estado inicial si se requiere animación en mount
	useEffect(() => {
		if (animateOnMount && isFirstRender.current) {
			engine.current.captureFirst();
		}
		isFirstRender.current = false;
	}, [animateOnMount]);

	// Exponer método para forzar captura
	const captureFirst = useCallback(() => {
		engine.current.captureFirst();
	}, []);

	// Exponer método para ejecutar
	const executeFlip = useCallback(
		async (changeCallback: () => void) => {
			if (!enabled) {
				changeCallback();
				return;
			}

			engine.current.captureFirst();
			changeCallback();
			engine.current.captureLast();
			await engine.current.play();
		},
		[enabled]
	);

	return (
		<div
			className={cn('flip-container', isTransitioning && 'flip-transitioning', className)}
			data-flip-enabled={enabled}
			data-flip-id={flipId}
			onClick={onClick}
			onDoubleClick={onDoubleClick}
			ref={containerRef}
			style={style}
		>
			{children}
		</div>
	);
});

// Exportar métodos estáticos para uso imperativo
(FlipContainer as unknown as { captureFirst: () => void }).captureFirst = () => {
	getFlipEngine().captureFirst();
};

(FlipContainer as unknown as { executeFlip: (cb: () => void) => Promise<void> }).executeFlip = async (
	cb: () => void
) => {
	const engine = getFlipEngine();
	engine.captureFirst();
	cb();
	engine.captureLast();
	await engine.play();
};
