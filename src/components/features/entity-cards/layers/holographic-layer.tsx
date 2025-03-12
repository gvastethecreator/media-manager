'use client';

import { cn } from '@/lib/utils/utils';
import * as React from 'react';
import type { ExplodeLayerTransformFunction, HolographicEffectOptions } from '../base/base-card-types';

export interface HolographicLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	mousePosition: { x: number; y: number };
	primaryColor?: string;
	secondaryColor?: string;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: HolographicEffectOptions;
}

/**
 * HolographicLayer - Capa que añade el efecto holográfico a la tarjeta.
 * Crea un gradiente dinámico que se mueve con la posición del cursor.
 */
export function HolographicLayer({
	isExploded,
	isHovered,
	mousePosition,
	primaryColor = 'rgba(0, 153, 255, 0.1)',
	secondaryColor = 'rgba(128, 0, 255, 0.2)',
	activeLayer,
	getExplodeLayerTransform,
	options,
}: HolographicLayerProps) {
	// Valores por defecto
	const defaultOptions: HolographicEffectOptions = {
		primaryColor,
		secondaryColor,
		intensity: 1,
		animationSpeed: 1,
		patternType: 'rainbow',
		visibleOnHover: true,
		layerIndex: 3,
	};

	// Combinar opciones
	const mergedOptions = { ...defaultOptions, ...options };

	// Calcular opacidad basada en configuración
	const opacity = mergedOptions.visibleOnHover ? (isHovered ? mergedOptions.intensity : 0) : mergedOptions.intensity;

	// Calcular ángulo del gradiente basado en posición del ratón
	const gradientDegree = Math.floor(mousePosition.x * 360);

	// Generar el gradiente según el tipo de patrón
	const getHolographicGradient = () => {
		const primary = mergedOptions.primaryColor;
		const secondary = mergedOptions.secondaryColor;

		switch (mergedOptions.patternType) {
			case 'linear':
				return `linear-gradient(${gradientDegree}deg, ${primary}, ${secondary})`;
			case 'radial':
				return `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, ${primary}, ${secondary})`;
			case 'diagonal':
				return `linear-gradient(45deg, ${primary}, ${secondary})`;
			default:
				return `linear-gradient(
					${gradientDegree}deg,
					rgba(255, 0, 0, 0.2),
					rgba(255, 165, 0, 0.2),
					rgba(255, 255, 0, 0.2),
					rgba(0, 128, 0, 0.2),
					rgba(0, 0, 255, 0.2),
					rgba(75, 0, 130, 0.2),
					rgba(238, 130, 238, 0.2)
				)`;
		}
	};

	const animationClass = mergedOptions.animationSpeed ? 'animate-holographic' : '';

	return (
		<div
			className={cn(
				'absolute inset-0 z-30 pointer-events-none',
				isExploded ? 'exploded-layer layer-holographic' : '',
				animationClass
			)}
			style={{
				background: getHolographicGradient(),
				opacity,
				mixBlendMode: 'overlay',
				filter: 'brightness(1.2) contrast(1.2)',
				...(isExploded ? getExplodeLayerTransform(mergedOptions.layerIndex || 3) : {}),
			}}
			data-layer-active={activeLayer === 'holographic' || null}
		/>
	);
}
