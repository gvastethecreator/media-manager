/**
 * @file Hook para efecto de inclinación 3D en cards TCG
 * @module hooks/use-tilt-3d
 * @description Proporciona efecto de inclinación 3D al hover con transformaciones CSS
 */

import { useCallback, useRef, useState } from 'react';

export interface Tilt3DOptions {
	/** Máximo ángulo de inclinación en grados (default: 15) */
	maxTilt?: number;
	/** Escala al hacer hover (default: 1.05) */
	scale?: number;
	/** Velocidad de transición en ms (default: 400) */
	transitionSpeed?: number;
	/** Brillo del reflejo (default: 0.4) */
	glareOpacity?: number;
	/** Si mostrar efecto de brillo (default: true) */
	enableGlare?: boolean;
	/** Si perspectiva se aplica al contenedor (default: true) */
	perspective?: boolean;
	/** Valor de perspectiva en px (default: 1000) */
	perspectiveValue?: number;
}

export interface Tilt3DState {
	/** Rotación X calculada */
	rotateX: number;
	/** Rotación Y calculada */
	rotateY: number;
	/** Escala actual */
	scale: number;
	/** Opacidad del reflejo */
	glareOpacity: number;
	/** Posición del reflejo X (0-100%) */
	glareX: number;
	/** Posición del reflejo Y (0-100%) */
	glareY: number;
	/** Si el mouse está sobre el elemento */
	isHovering: boolean;
}

export interface Tilt3DReturn {
	/** Ref para asignar al elemento */
	ref: React.RefObject<HTMLDivElement | null>;
	/** Estado actual del tilt */
	state: Tilt3DState;
	/** Handlers para aplicar al elemento */
	handlers: {
		onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
		onMouseEnter: () => void;
		onMouseLeave: () => void;
	};
	/** Estilos calculados para el elemento */
	style: React.CSSProperties;
	/** Estilos para el efecto de reflejo */
	glareStyle: React.CSSProperties;
}

/**
 * Hook para crear efecto de inclinación 3D en cards
 * @param options - Opciones de configuración del efecto
 * @returns Objeto con ref, handlers y estilos calculados
 *
 * @example
 * ```tsx
 * const { ref, style, glareStyle, handlers } = useTilt3D({ maxTilt: 20 });
 *
 * <div ref={ref} style={style} {...handlers}>
 *   <div className="glare" style={glareStyle} />
 *   Content
 * </div>
 * ```
 */
export function useTilt3D(options: Tilt3DOptions = {}): Tilt3DReturn {
	const {
		maxTilt = 15,
		scale = 1.02,
		transitionSpeed = 400,
		glareOpacity: glareOpacityConfig = 0.4,
		enableGlare = true,
		perspective = true,
		perspectiveValue = 1000,
	} = options;

	const elementRef = useRef<HTMLDivElement>(null);
	const [state, setState] = useState<Tilt3DState>({
		rotateX: 0,
		rotateY: 0,
		scale: 1,
		glareOpacity: 0,
		glareX: 50,
		glareY: 50,
		isHovering: false,
	});

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!elementRef.current) return;

			const rect = elementRef.current.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;

			// Calcular posición relativa del mouse (-1 a 1)
			const mouseX = (e.clientX - centerX) / (rect.width / 2);
			const mouseY = (e.clientY - centerY) / (rect.height / 2);

			// Invertir Y para que el tilt sea natural
			const rotateX = -mouseY * maxTilt;
			const rotateY = mouseX * maxTilt;

			// Calcular posición del reflejo basada en la posición del mouse
			const glareX = ((e.clientX - rect.left) / rect.width) * 100;
			const glareY = ((e.clientY - rect.top) / rect.height) * 100;

			setState({
				rotateX,
				rotateY,
				scale,
				glareOpacity: enableGlare ? glareOpacityConfig : 0,
				glareX,
				glareY,
				isHovering: true,
			});
		},
		[maxTilt, scale, glareOpacityConfig, enableGlare]
	);

	const handleMouseEnter = useCallback(() => {
		setState((prev) => ({
			...prev,
			scale,
			isHovering: true,
		}));
	}, [scale]);

	const handleMouseLeave = useCallback(() => {
		setState({
			rotateX: 0,
			rotateY: 0,
			scale: 1,
			glareOpacity: 0,
			glareX: 50,
			glareY: 50,
			isHovering: false,
		});
	}, []);

	// Estilos calculados para el elemento
	const style: React.CSSProperties = {
		transform: perspective
			? `perspective(${perspectiveValue}px) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg) scale3d(${state.scale}, ${state.scale}, ${state.scale})`
			: `rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg) scale3d(${state.scale}, ${state.scale}, ${state.scale})`,
		transition: `transform ${transitionSpeed}ms cubic-bezier(0.23, 1, 0.32, 1)`,
		transformStyle: 'preserve-3d',
		willChange: 'transform',
	};

	// Estilos para el efecto de reflejo
	const glareStyle: React.CSSProperties = {
		position: 'absolute',
		inset: 0,
		pointerEvents: 'none',
		background: enableGlare
			? `radial-gradient(circle at ${state.glareX}% ${state.glareY}%, rgba(255,255,255,${state.glareOpacity}) 0%, transparent 60%)`
			: 'none',
		opacity: state.isHovering ? 1 : 0,
		transition: `opacity ${transitionSpeed}ms ease-out`,
		zIndex: 10,
		borderRadius: 'inherit',
	};

	return {
		ref: elementRef,
		state,
		handlers: {
			onMouseMove: handleMouseMove,
			onMouseEnter: handleMouseEnter,
			onMouseLeave: handleMouseLeave,
		},
		style,
		glareStyle,
	};
}

/**
 * Hook simplificado para solo escala al hover sin tilt
 */
export function useHoverScale(scale = 1.05, transitionSpeed = 300) {
	const [isHovering, setIsHovering] = useState(false);

	const handlers = {
		onMouseEnter: () => setIsHovering(true),
		onMouseLeave: () => setIsHovering(false),
	};

	const style: React.CSSProperties = {
		transform: `scale3d(${isHovering ? scale : 1}, ${isHovering ? scale : 1}, 1)`,
		transition: `transform ${transitionSpeed}ms cubic-bezier(0.23, 1, 0.32, 1)`,
		willChange: 'transform',
	};

	return { handlers, style, isHovering };
}
