'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';
import { memo, useMemo } from 'react';
import type { ExplodeLayerTransformFunction, GrainEffectOptions, TextureConfig } from '../../types/base-card-types';

export interface GrainEffectLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	texture?: TextureConfig;
	options?: GrainEffectOptions;
}

/**
 * GrainEffectLayer - Capa que añade efecto de grano o textura a la tarjeta.
 * Puede usar diferentes patrones de grano o una imagen personalizada.
 *
 * @param props - Propiedades del componente
 * @returns Componente de efecto de grano
 */
export const GrainEffectLayer = memo(function GrainEffectLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	texture,
	options,
}: GrainEffectLayerProps) {
	// Valores por defecto
	const defaultOptions: GrainEffectOptions = {
		intensity: 0.15,
		density: 0.6,
		contrast: 1.2,
		noise: 'light',
		animated: false,
		animationSpeed: 1,
		visibleOnHover: true,
		layerIndex: 6,
	};

	// Combinar opciones
	const mergedOptions = useMemo(() => {
		return { ...defaultOptions, ...options };
	}, [options]);

	// Calcular opacidad basada en configuración
	const opacity = useMemo(() => {
		return mergedOptions.visibleOnHover
			? isHovered
				? mergedOptions.intensity || 0.15
				: (mergedOptions.intensity || 0.15) * 0.5
			: mergedOptions.intensity || 0.15;
	}, [mergedOptions.visibleOnHover, mergedOptions.intensity, isHovered]);

	// Generar una clase CSS dependiendo del tipo de ruido
	const noiseClass = useMemo(() => {
		switch (mergedOptions.noise) {
			case 'digital':
				return 'digital-noise';
			case 'film':
				return 'film-grain';
			case 'heavy':
				return 'heavy-noise';
			default:
				return 'light-noise';
		}
	}, [mergedOptions.noise]);

	// Generar una cadena SVG para el ruido - memoizada para evitar regeneraciones en cada render
	const noiseSVG = useMemo(() => {
		if (texture?.imageUrl) return null;
		if (noiseClass) return null;

		return generateNoiseSVG(mergedOptions.density || 0.6, mergedOptions.contrast || 1.2);
	}, [mergedOptions.density, mergedOptions.contrast, texture?.imageUrl, noiseClass]);

	// Determinar tipo de ruido y textura
	const noisePattern = useMemo(() => {
		// Si hay una textura personalizada con URL, la usamos
		if (texture?.imageUrl) {
			return {
				backgroundImage: `url(${texture.imageUrl})`,
				backgroundSize: 'cover',
				backgroundRepeat: 'no-repeat',
				opacity: texture.opacity || opacity,
				mixBlendMode: 'overlay',
			};
		}

		// Si hay un tipo de ruido configurado, usamos una clase CSS predefinida
		if (noiseClass) {
			return {
				opacity,
				mixBlendMode: 'overlay',
			};
		}

		// Si no hay configuración específica, usamos un ruido basado en SVG
		return {
			backgroundImage: `url("data:image/svg+xml;base64,${btoa(noiseSVG || '')}")`,
			backgroundSize: '100px 100px',
			opacity,
			mixBlendMode: 'overlay',
		};
	}, [texture, noiseClass, noiseSVG, opacity]);

	const animationClass = mergedOptions.animated ? 'animate-grain' : '';

	return (
		<div
			className={cn(
				'absolute inset-0 z-15 pointer-events-none',
				isExploded ? 'exploded-layer layer-grain' : '',
				noiseClass,
				animationClass
			)}
			style={
				{
					...noisePattern,
					...(isExploded ? getExplodeLayerTransform(mergedOptions.layerIndex || 6) : {}),
				} as React.CSSProperties
			}
			data-layer-active={activeLayer === 'grain' || null}
			data-testid="grain-effect-layer"
		/>
	);
});

// Generar una cadena SVG para el ruido
function generateNoiseSVG(density: number, contrast: number) {
	// Esta función genera un SVG con ruido aleatorio
	const pixels = 50;
	const scale = density * 100;
	let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 ${pixels} ${pixels}">`;

	for (let i = 0; i < scale; i++) {
		const x = Math.floor(Math.random() * pixels);
		const y = Math.floor(Math.random() * pixels);
		const size = Math.random() * 2;
		const opacity = Math.random() * contrast;

		svgContent += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="white" opacity="${opacity}" />`;
	}

	svgContent += '</svg>';
	return svgContent;
}
