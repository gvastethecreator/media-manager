'use client';

import { cn } from '@/lib/utils/utils';
import * as React from 'react';
import type { ExplodeLayerTransformFunction, ScanlinesOptions } from '../base/base-card-types';

export interface ScanlinesLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: ScanlinesOptions;
}

/**
 * ScanlinesLayer - Capa que añade el efecto de líneas de escaneo a la tarjeta.
 * Crea un efecto retro/digital con líneas horizontales.
 */
export function ScanlinesLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	options,
}: ScanlinesLayerProps) {
	// Valores por defecto
	const defaultOptions: ScanlinesOptions = {
		opacity: 0.2,
		spacing: 4,
		color: 'rgba(255,255,255,0.15)',
		animate: false,
		direction: 'horizontal',
		visibleOnHover: false,
	};

	// Combinar opciones
	const mergedOptions = { ...defaultOptions, ...options };

	// Calcular opacidad basada en configuración
	const opacity = mergedOptions.visibleOnHover ? (isHovered ? mergedOptions.opacity : 0) : mergedOptions.opacity;

	// Seleccionar dirección del patrón
	const getScanlinesGradient = () => {
		const color = mergedOptions.color;
		const spacing = mergedOptions.spacing || 4;

		switch (mergedOptions.direction) {
			case 'vertical':
				return `repeating-linear-gradient(90deg, transparent, transparent ${spacing - 2}px, ${color} ${spacing}px)`;
			case 'diagonal':
				return `repeating-linear-gradient(45deg, transparent, transparent ${spacing - 2}px, ${color} ${spacing}px)`;
			default:
				return `repeating-linear-gradient(0deg, transparent, transparent ${spacing - 2}px, ${color} ${spacing}px)`;
		}
	};

	const animationClass = mergedOptions.animate
		? mergedOptions.direction === 'horizontal'
			? 'animate-scanlines-horizontal'
			: mergedOptions.direction === 'vertical'
				? 'animate-scanlines-vertical'
				: 'animate-scanlines-diagonal'
		: '';

	return (
		<div
			className={cn(
				'absolute inset-0 z-20 pointer-events-none',
				isExploded ? 'exploded-layer layer-scanlines' : '',
				animationClass
			)}
			style={{
				background: getScanlinesGradient(),
				opacity,
				...(isExploded ? getExplodeLayerTransform(mergedOptions.layerIndex || 2) : {}),
			}}
			data-layer-active={activeLayer === 'scanlines' || null}
		/>
	);
}
