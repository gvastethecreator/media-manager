'use client';

import { cn } from '@/lib/utils/utils';
import type * as React from 'react';
import type { BorderOptions, ExplodeLayerTransformFunction } from '../base/base-card-types';

export interface AnimatedBorderLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	borderConfig?: BorderOptions;
	options?: BorderOptions;
}

/**
 * AnimatedBorderLayer - Componente que añade un borde animado a la tarjeta.
 * Soporta diferentes configuraciones de animación, patrones y efectos luminosos.
 */
export function AnimatedBorderLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	borderConfig,
	options,
}: AnimatedBorderLayerProps) {
	// Valores por defecto
	const defaultOptions: BorderOptions = {
		color: 'rgba(0, 153, 255, 1)',
		width: 2,
		pattern: 'solid',
		animationType: 'flow',
		animationSpeed: 1,
		animationDuration: 6,
		glowColor: 'rgba(0, 153, 255, 0.7)',
		glowIntensity: 5,
		glowOnHover: true,
		layerIndex: 5,
		animation: {
			type: 'flow',
			duration: 3000,
			timing: 'linear',
			iteration: 'infinite',
		},
	};

	// Prioridad: options > borderConfig > defaultOptions
	const mergedOptions = { ...defaultOptions, ...borderConfig, ...options };

	// Calcular el estilo del borde basado en el patrón
	const getBorderStyle = () => {
		switch (mergedOptions.pattern) {
			case 'dashed':
				return 'dashed';
			case 'dotted':
				return 'dotted';
			case 'double':
				return 'double';
			default:
				return 'solid';
		}
	};

	// Calcular estilo de animación basado en el tipo
	const getAnimationClass = () => {
		if (!isHovered && mergedOptions.glowOnHover) {
			return '';
		}

		switch (mergedOptions.animationType) {
			case 'pulse':
				return 'animate-border-pulse';
			case 'rainbow':
				return 'animate-border-rainbow';
			case 'flow':
				return 'animate-border-flow';
			default:
				return '';
		}
	};

	// Calcular el estilo de brillo
	const getGlowStyle = () => {
		if (!mergedOptions.glowColor || (!isHovered && mergedOptions.glowOnHover)) {
			return {};
		}

		return {
			boxShadow: `0 0 ${mergedOptions.glowIntensity}px ${mergedOptions.glowColor}`,
		};
	};

	// CSS variables para la animación
	const cssVars = {
		'--border-color': mergedOptions.color,
		'--animation-duration': `${mergedOptions.animationDuration}s`,
		'--border-width': `${mergedOptions.width}px`,
	} as React.CSSProperties;

	return (
		<div
			className={cn(
				'absolute inset-0 z-50 pointer-events-none border rounded-lg',
				isExploded ? 'exploded-layer layer-border' : '',
				getAnimationClass()
			)}
			style={{
				borderStyle: getBorderStyle(),
				borderColor: mergedOptions.color,
				borderWidth: mergedOptions.width,
				...getGlowStyle(),
				...cssVars,
				...(isExploded ? getExplodeLayerTransform(mergedOptions.layerIndex || 5) : {}),
			}}
			data-layer-active={activeLayer === 'border' || null}
		/>
	);
}

/**
 * Estilos CSS globales para las animaciones del borde
 * Estos estilos deben ser agregados a un archivo de CSS global
 */
/*
@keyframes pulsingBorder {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes rotateBorder {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 0%;
  }
}

@keyframes flowBorder {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 200% 0%;
  }
}
*/
