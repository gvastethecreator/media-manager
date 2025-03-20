'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import type { ExplodeLayerTransformFunction, GlowEffectOptions } from '../../../../types/base-card-types';

export interface GlowEffectLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	mousePosition: { x: number; y: number };
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	glowConfig?: GlowEffectOptions;
	options?: GlowEffectOptions;
}

/**
 * GlowEffectLayer - Componente que añade un efecto de halo luminoso a la tarjeta.
 * Puede ser estático, pulsante o seguir la posición del ratón.
 */
export function GlowEffectLayer({
	isExploded,
	isHovered,
	mousePosition,
	activeLayer,
	getExplodeLayerTransform,
	glowConfig,
	options,
}: GlowEffectLayerProps) {
	// Valores por defecto
	const defaultOptions: GlowEffectOptions = {
		color: 'rgba(0, 153, 255, 0.35)',
		intensity: 1,
		size: 100,
		blurAmount: 30,
		animationType: 'follow-mouse',
		pulseSpeed: 1.5,
		visibleOnHover: true,
		layerIndex: 4,
	};

	// Prioridad: options > glowConfig > defaultOptions
	const mergedOptions = { ...defaultOptions, ...glowConfig, ...options };

	// Calcular opacidad basada en configuración
	const opacity = mergedOptions.visibleOnHover ? (isHovered ? mergedOptions.intensity : 0) : mergedOptions.intensity;

	// Posición y tamaño del brillo
	const [glowPosition, setGlowPosition] = React.useState({ x: 50, y: 50 });
	const [glowSize, setGlowSize] = React.useState(mergedOptions.size || 100);

	// Animar tamaño del brillo si el tipo es "pulse"
	React.useEffect(() => {
		if (mergedOptions.animationType !== 'pulse') {
			return;
		}

		const pulseSpeed = mergedOptions.pulseSpeed || 1.5;
		const baseSize = mergedOptions.size || 100;
		const minSize = baseSize * 0.7;
		const maxSize = baseSize * 1.3;

		let animationFrame: number;
		const startTime = Date.now();

		const animate = () => {
			const elapsed = (Date.now() - startTime) * pulseSpeed * 0.001;
			const size = minSize + Math.abs(Math.sin(elapsed * Math.PI)) * (maxSize - minSize);
			setGlowSize(size);
			animationFrame = requestAnimationFrame(animate);
		};

		animationFrame = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationFrame);
	}, [mergedOptions.animationType, mergedOptions.size, mergedOptions.pulseSpeed]);

	// Actualizar posición del brillo basado en el tipo de animación
	React.useEffect(() => {
		if (mergedOptions.animationType !== 'follow-mouse') {
			return;
		}

		setGlowPosition({
			x: mousePosition.x,
			y: mousePosition.y,
		});
	}, [mousePosition, mergedOptions.animationType]);

	// Calcular la posición del brillo basada en la configuración
	const getGlowPosition = () => {
		switch (mergedOptions.animationType) {
			case 'follow-mouse':
				return {
					left: `${glowPosition.x}%`,
					top: `${glowPosition.y}%`,
				};
			case 'static':
				return {
					left: '50%',
					top: '50%',
				};
			default:
				return {
					left: '50%',
					top: '50%',
				};
		}
	};

	// Si el tipo de animación es "none", no mostramos nada
	if (mergedOptions.animationType === 'none') {
		return null;
	}

	return (
		<div
			className={cn(
				'absolute inset-0 z-40 overflow-hidden pointer-events-none',
				isExploded ? 'exploded-layer layer-glow' : ''
			)}
			style={isExploded ? getExplodeLayerTransform(mergedOptions.layerIndex || 4) : {}}
			data-layer-active={activeLayer === 'glow' || null}
		>
			<div
				className={cn(
					'absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl',
					mergedOptions.animationType === 'pulse' ? 'animate-pulse-slow' : ''
				)}
				style={{
					...getGlowPosition(),
					width: `${glowSize}px`,
					height: `${glowSize}px`,
					background: mergedOptions.color,
					opacity,
					filter: `blur(${mergedOptions.blurAmount}px)`,
				}}
			/>
		</div>
	);
}
