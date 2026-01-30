/**
 * @file Componente MorphContainer
 * @module components/transitions/MorphContainer
 * @description Contenedor con morphing de formas
 */

import React, { useEffect, useRef, useState } from 'react';
import type { AnimeInstance } from '@/lib/anime';
import type { MorphConfig } from '@/lib/transitions';
import { generateBorderRadius, generateClipPath, getMorphEngine } from '@/lib/transitions';
import { cn } from '@/lib/utils';

interface MorphContainerProps {
	/** ID único */
	morphId: string;
	/** Forma actual */
	shape: string;
	/** Contenido */
	children: React.ReactNode;
	/** Clases CSS */
	className?: string;
	/** Configuración de morphing */
	config?: MorphConfig;
	/** Si está habilitado */
	enabled?: boolean;
	/** Estilos adicionales */
	style?: React.CSSProperties;
}

/**
 * Contenedor que morphs entre diferentes formas
 *
 * @example
 * ```tsx
 * function Example() {
 *   const [shape, setShape] = useState('square');
 *
 *   return (
 *     <>
 *       <MorphContainer morphId="shape-1" shape={shape} className="w-32 h-32 bg-primary">
 *         Contenido
 *       </MorphContainer>
 *       <button onClick={() => setShape('circle')}>Círculo</button>
 *       <button onClick={() => setShape('rounded')}>Redondeado</button>
 *     </>
 *   );
 * }
 * ```
 */
export const MorphContainer = React.memo(function MorphContainer({
	morphId,
	shape,
	children,
	className,
	config,
	enabled = true,
	style,
}: MorphContainerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const engine = useRef(getMorphEngine());
	const [isMorphing, setIsMorphing] = useState(false);
	const previousShape = useRef(shape);

	// Registrar en el motor
	useEffect(() => {
		if (!enabled) return;

		engine.current.register(morphId, shape);

		return () => {
			engine.current.unregister(morphId);
		};
	}, [morphId, shape, enabled]);

	// Ejecutar morphing cuando cambia la forma
	useEffect(() => {
		if (!(enabled && containerRef.current) || shape === previousShape.current) {
			return;
		}

		const performMorph = async () => {
			setIsMorphing(true);

			await engine.current.morph(containerRef.current!, previousShape.current, shape, config);

			previousShape.current = shape;
			setIsMorphing(false);
		};

		performMorph();
	}, [shape, enabled, config]);

	// Obtener estilos según la forma
	const getShapeStyles = (): React.CSSProperties => {
		const clipPath = generateClipPath(shape);
		const borderRadius = generateBorderRadius(shape);

		return {
			clipPath: CSS.supports('clip-path', clipPath) ? clipPath : undefined,
			borderRadius,
			...style,
		};
	};

	return (
		<div
			className={cn('morph-container', isMorphing && 'morph-transitioning', `morph-shape-${shape}`, className)}
			data-morph-id={morphId}
			data-morph-shape={shape}
			ref={containerRef}
			style={getShapeStyles()}
		>
			{children}
		</div>
	);
});

// ============================================================================
// Componente MorphPath (para SVG)
// ============================================================================

interface MorphPathProps {
	/** ID único */
	id: string;
	/** Path inicial */
	fromPath: string;
	/** Path final */
	toPath: string;
	/** Progreso (0-1) */
	progress: number;
	/** Clases CSS */
	className?: string;
	/** Color de relleno */
	fill?: string;
	/** Color de trazo */
	stroke?: string;
	/** Ancho de trazo */
	strokeWidth?: number;
}

/**
 * Componente SVG para morphing de paths
 */
export const MorphPath = React.memo(function MorphPath({
	id,
	fromPath,
	toPath,
	progress,
	className,
	fill = 'currentColor',
	stroke,
	strokeWidth = 1,
}: MorphPathProps) {
	const pathRef = useRef<SVGPathElement>(null);

	// Interpolación simple de paths (para morphing complejo usar biblioteca especializada)
	const interpolatePath = (from: string, to: string, t: number): string => {
		// Por ahora hacemos un crossfade simple
		// En producción, usar algo como flubber o anime.js con morphSVG
		return t < 0.5 ? from : to;
	};

	const currentPath = interpolatePath(fromPath, toPath, progress);

	return (
		<path
			className={cn('morph-path', className)}
			d={currentPath}
			fill={fill}
			id={id}
			ref={pathRef}
			stroke={stroke}
			strokeWidth={strokeWidth}
		/>
	);
});

// ============================================================================
// Componente LiquidContainer
// ============================================================================

interface LiquidContainerProps {
	/** Contenido */
	children: React.ReactNode;
	/** Clases CSS */
	className?: string;
	/** Intensidad del efecto (0-1) */
	intensity?: number;
	/** Duración del ciclo (ms) */
	duration?: number;
	/** Si está activo */
	active?: boolean;
}

/**
 * Contenedor con efecto líquido orgánico
 */
export const LiquidContainer = React.memo(function LiquidContainer({
	children,
	className,
	intensity = 0.3,
	duration = 4000,
	active = true,
}: LiquidContainerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const animationRef = useRef<AnimeInstance | null>(null);

	useEffect(() => {
		if (!(active && containerRef.current)) return;

		// Importar anime dinámicamente para evitar problemas SSR
		const startAnimation = async () => {
			const { createLiquidMorph } = await import('@/lib/transitions');
			animationRef.current = await createLiquidMorph(containerRef.current!, intensity, duration);
		};

		startAnimation();

		return () => {
			if (animationRef.current) {
				animationRef.current.pause?.();
			}
		};
	}, [active, intensity, duration]);

	return (
		<div className={cn('liquid-container', active && 'liquid-active', className)} ref={containerRef}>
			{children}
		</div>
	);
});
