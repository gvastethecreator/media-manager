'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import type { HolographicLayerProps } from '../../types/card-layer-types';
import { holographicStyles } from './holographic-styles';

/**
 * Componente que renderiza un efecto holográfico para tarjetas
 * El efecto holográfico simula un acabado iridiscente que cambia de color según el ángulo/posición del ratón
 */
export function HolographicLayer({
	isExploded,
	isHovered,
	mousePosition,
	activeLayer,
	getExplodeLayerTransform,
	primaryColor = 'rgba(0, 153, 255, 0.1)',
	secondaryColor = 'rgba(128, 0, 255, 0.2)',
	options,
	visibleOnHover = false,
}: HolographicLayerProps) {
	// Determinar visibilidad
	const isVisible = isHovered || !visibleOnHover || (activeLayer === 'holographic' && isExploded);

	// Si no es visible, no renderizar
	if (!isVisible && !isExploded) {
		return null;
	}

	// Variables de estilo
	const patternType = options?.patternType || 'rainbow';
	const intensity = options?.intensity !== undefined ? options.intensity : 1;

	// Calcula la posición en función del movimiento del ratón
	const positionX = (mousePosition.x * 100).toFixed(2);
	const positionY = (mousePosition.y * 100).toFixed(2);

	// Seleccionar estilo basado en el tipo de patrón
	const style = holographicStyles[patternType as keyof typeof holographicStyles] || holographicStyles.rainbow;

	return (
		<div
			className={cn(
				'absolute inset-0 z-0 card-holographic-effect overflow-hidden',
				isExploded ? 'exploded-layer layer-holographic' : '',
				activeLayer === 'holographic' ? 'active-layer z-30' : ''
			)}
			style={{
				...getExplodeLayerTransform(options?.layerIndex || 3),
				...(isExploded ? { zIndex: options?.layerIndex || 3 } : {}),
				opacity: isHovered || isExploded ? intensity : intensity * 0.5,
				backgroundImage: style.background
					.replace('{{primaryColor}}', primaryColor)
					.replace('{{secondaryColor}}', secondaryColor)
					.replace('{{positionX}}', positionX)
					.replace('{{positionY}}', positionY),
				backgroundSize: style.backgroundSize,
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
				backgroundBlendMode: 'color-dodge',
				mixBlendMode: 'color-dodge',
				filter: 'saturate(1.5) contrast(1.1)',
			}}
			data-layer-id="holographic"
			data-layer-active={activeLayer === 'holographic' || null}
		/>
	);
}
