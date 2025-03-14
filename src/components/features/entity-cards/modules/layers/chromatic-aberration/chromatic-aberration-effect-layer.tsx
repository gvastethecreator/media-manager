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
}

/**
 * ChromaticAberrationEffectLayer - Capa que añade un efecto de aberración cromática.
 * Crea desplazamientos de los canales de color para simular efectos de lente.
 */
export function ChromaticAberrationEffectLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
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

	// Si no está habilitado, no renderizar nada
	if (!mergedConfig.enabled) {
		return null;
	}

	// Si es visible solo en hover y no está en hover, no renderizar
	if (mergedConfig.visibleOnHover && !isHovered) {
		return null;
	}

	// Generamos el estilo CSS en función del modo
	const getStyle = () => {
		const baseStyle: React.CSSProperties = {
			...(isExploded ? getExplodeLayerTransform(mergedConfig.layerIndex) : {}),
		};

		if (mergedConfig.mode === 'simple') {
			// Modo simple: usa blur y transform
			return {
				...baseStyle,
				filter: `blur(${mergedConfig.offset}px)`,
				transform: `translate(${mergedConfig.offset * mergedConfig.intensity}px, ${mergedConfig.offset * mergedConfig.intensity}px)`,
			};
		}

		// Modo avanzado: usa el filtro de aberración cromática
		return {
			...baseStyle,
			position: 'absolute',
			inset: 0,
			mixBlendMode: 'screen',
			filter: `blur(${mergedConfig.quality === 'low' ? 1 : mergedConfig.quality === 'high' ? 0.5 : 0.8}px)`,
		};
	};

	// En modo avanzado, renderizamos tres capas (una por cada canal RGB)
	if (mergedConfig.mode === 'advanced') {
		return (
			<>
				<div
					className={cn(
						'absolute inset-0 pointer-events-none z-25',
						isExploded ? 'exploded-layer layer-chromatic-red' : ''
					)}
					style={{
						...getStyle(),
						transform: `translate(${mergedConfig.redOffset}px, 0)`,
						backgroundColor: 'rgba(255,0,0,0.8)',
					}}
					data-layer-active={activeLayer === 'chromatic-aberration' || null}
				/>
				<div
					className={cn(
						'absolute inset-0 pointer-events-none z-25',
						isExploded ? 'exploded-layer layer-chromatic-green' : ''
					)}
					style={{
						...getStyle(),
						transform: `translate(${mergedConfig.greenOffset}px, 0)`,
						backgroundColor: 'rgba(0,255,0,0.8)',
					}}
					data-layer-active={activeLayer === 'chromatic-aberration' || null}
				/>
				<div
					className={cn(
						'absolute inset-0 pointer-events-none z-25',
						isExploded ? 'exploded-layer layer-chromatic-blue' : ''
					)}
					style={{
						...getStyle(),
						transform: `translate(${mergedConfig.blueOffset}px, 0)`,
						backgroundColor: 'rgba(0,0,255,0.8)',
					}}
					data-layer-active={activeLayer === 'chromatic-aberration' || null}
				/>
			</>
		);
	}

	// Modo simple: una sola capa
	return (
		<div
			className={cn(
				'absolute inset-0 pointer-events-none z-25',
				isExploded ? 'exploded-layer layer-chromatic-aberration' : ''
			)}
			style={getStyle()}
			data-layer-active={activeLayer === 'chromatic-aberration' || null}
		/>
	);
}

export default ChromaticAberrationEffectLayer;
