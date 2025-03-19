'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';
import type { LayerComponentProps } from '../layer-plugin-system';

export interface ChromaticAberrationConfig {
	enabled: boolean;
	offset: number;
	intensity: number;
	redOffset: number;
	greenOffset: number;
	blueOffset: number;
	visibleOnHover: boolean;
	quality: 'low' | 'medium' | 'high';
	mode: 'simple' | 'advanced';
	layerIndex: number;
	[key: string]: unknown; // Añadido para compatibilidad con índices dinámicos
}

/**
 * ChromaticAberrationEffectLayer - Capa que añade un efecto de aberración cromática.
 * Crea desplazamientos de los canales de color para simular efectos de lente.
 */
export function ChromaticAberrationEffectLayer({
	isExploded,
	isHovered = false,
	mousePosition = { x: 0, y: 0 },
	activeLayer,
	getExplodeLayerTransform,
	config,
	entityType,
	entityId,
}: LayerComponentProps<ChromaticAberrationConfig>) {
	// Valores por defecto
	const defaultConfig: ChromaticAberrationConfig = {
		enabled: true,
		offset: 2,
		intensity: 0.5,
		redOffset: 2,
		greenOffset: 0,
		blueOffset: -2,
		visibleOnHover: true,
		quality: 'medium',
		mode: 'simple',
		layerIndex: 4,
	};

	// Combinar configuración
	const mergedConfig = { ...defaultConfig, ...config };

	// Variable para determinar si esta capa está activa
	const isActive = activeLayer === 'chromatic-aberration';

	// Si no está habilitado, no renderizar nada
	if (!mergedConfig.enabled) {
		return null;
	}

	// Si es visible solo en hover y no está en hover ni es la capa activa, no renderizar
	if (mergedConfig.visibleOnHover && !isHovered && !isActive) {
		return null;
	}

	// Estilos base para todas las capas
	const baseStyle = {
		...(isExploded ? getExplodeLayerTransform(mergedConfig.layerIndex) : {}),
		// Añadir bordes para depuración cuando la capa está activa
		...(isActive ? {
			outline: '2px dashed rgba(255,0,255,0.7)',
			outlineOffset: '-2px',
		} : {}),
	} as React.CSSProperties;

	// Estilos para el modo avanzado
	const advancedStyle = {
		...baseStyle,
		position: 'absolute',
		inset: 0,
		mixBlendMode: 'screen',
		filter: `blur(${mergedConfig.quality === 'low' ? 1 : mergedConfig.quality === 'high' ? 0.5 : 0.8}px)`,
	} as React.CSSProperties;

	// Estilos para el modo simple
	const simpleStyle = {
		...baseStyle,
		filter: `blur(${mergedConfig.offset}px)`,
		transform: `translate(${mergedConfig.offset * mergedConfig.intensity}px, ${mergedConfig.offset * mergedConfig.intensity}px)`,
	} as React.CSSProperties;

	// En modo avanzado, renderizamos tres capas (una por cada canal RGB)
	if (mergedConfig.mode === 'advanced') {
		// Estilos específicos para cada canal
		const redStyle = {
			...advancedStyle,
			transform: `translate(${mergedConfig.redOffset}px, 0)`,
			backgroundColor: 'rgba(255,0,0,0.8)',
		} as React.CSSProperties;

		const greenStyle = {
			...advancedStyle,
			transform: `translate(${mergedConfig.greenOffset}px, 0)`,
			backgroundColor: 'rgba(0,255,0,0.8)',
		} as React.CSSProperties;

		const blueStyle = {
			...advancedStyle,
			transform: `translate(${mergedConfig.blueOffset}px, 0)`,
			backgroundColor: 'rgba(0,0,255,0.8)',
		} as React.CSSProperties;

		return (
			<>
				<div
					className={cn(
						'absolute inset-0 pointer-events-none z-25',
						isExploded ? 'exploded-layer layer-chromatic-red' : '',
						isActive ? 'active-layer' : ''
					)}
					style={redStyle}
					data-layer-active={isActive || null}
					data-layer-type="chromatic-aberration"
					data-layer-mode="advanced"
					data-layer-channel="red"
				/>
				<div
					className={cn(
						'absolute inset-0 pointer-events-none z-25',
						isExploded ? 'exploded-layer layer-chromatic-green' : '',
						isActive ? 'active-layer' : ''
					)}
					style={greenStyle}
					data-layer-active={isActive || null}
					data-layer-type="chromatic-aberration"
					data-layer-mode="advanced"
					data-layer-channel="green"
				/>
				<div
					className={cn(
						'absolute inset-0 pointer-events-none z-25',
						isExploded ? 'exploded-layer layer-chromatic-blue' : '',
						isActive ? 'active-layer' : ''
					)}
					style={blueStyle}
					data-layer-active={isActive || null}
					data-layer-type="chromatic-aberration"
					data-layer-mode="advanced"
					data-layer-channel="blue"
				/>

				{/* Etiqueta informativa cuando está en modo exploded */}
				{isExploded && isActive && (
					<div className="absolute top-0 left-0 bg-background/80 text-[10px] px-1.5 py-0.5 rounded z-50 pointer-events-none">
						Capa: Aberración Cromática (RGB)
					</div>
				)}
			</>
		);
	}

	// Modo simple: una sola capa
	return (
		<>
			<div
				className={cn(
					'absolute inset-0 pointer-events-none z-25',
					isExploded ? 'exploded-layer layer-chromatic-aberration' : '',
					isActive ? 'active-layer' : ''
				)}
				style={simpleStyle}
				data-layer-active={isActive || null}
				data-layer-type="chromatic-aberration"
				data-layer-mode="simple"
			/>

			{/* Etiqueta informativa cuando está en modo exploded */}
			{isExploded && isActive && (
				<div className="absolute top-0 left-0 bg-background/80 text-[10px] px-1.5 py-0.5 rounded z-50 pointer-events-none">
					Capa: Aberración Cromática (Simple)
				</div>
			)}
		</>
	);
}

export default ChromaticAberrationEffectLayer;
