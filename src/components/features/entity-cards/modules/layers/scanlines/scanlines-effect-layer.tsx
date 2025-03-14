'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import type { LayerComponentProps } from '../layer-plugin-system';

export interface ScanlinesConfig {
	enabled: boolean;
	opacity: number;
	spacing: number;
	color: string;
	animate: boolean;
	direction: 'horizontal' | 'vertical' | 'diagonal';
	visibleOnHover: boolean;
	layerIndex: number;
}

/**
 * ScanlinesEffectLayer - Capa que añade el efecto de líneas de escaneo a la tarjeta.
 * Crea un efecto retro/digital con líneas horizontales, verticales o diagonales.
 */
export function ScanlinesEffectLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: LayerComponentProps<ScanlinesConfig>) {
	// Valores por defecto
	const defaultConfig: ScanlinesConfig = {
		enabled: true,
		opacity: 0.2,
		spacing: 4,
		color: 'rgba(255,255,255,0.15)',
		animate: false,
		direction: 'horizontal',
		visibleOnHover: false,
		layerIndex: 3,
	};

	// Combinar configuración
	const mergedConfig = { ...defaultConfig, ...config };

	// Si no está habilitado, no renderizar nada
	if (!mergedConfig.enabled) {
		return null;
	}

	// Calcular opacidad basada en configuración
	const opacity = mergedConfig.visibleOnHover ? (isHovered ? mergedConfig.opacity : 0) : mergedConfig.opacity;

	// Seleccionar dirección del patrón
	const getScanlinesGradient = () => {
		const color = mergedConfig.color;
		const spacing = mergedConfig.spacing || 4;

		switch (mergedConfig.direction) {
			case 'vertical':
				return `repeating-linear-gradient(90deg, transparent, transparent ${spacing - 2}px, ${color} ${spacing}px)`;
			case 'diagonal':
				return `repeating-linear-gradient(45deg, transparent, transparent ${spacing - 2}px, ${color} ${spacing}px)`;
			default:
				return `repeating-linear-gradient(0deg, transparent, transparent ${spacing - 2}px, ${color} ${spacing}px)`;
		}
	};

	const animationClass = mergedConfig.animate
		? mergedConfig.direction === 'horizontal'
			? 'animate-scanlines-horizontal'
			: mergedConfig.direction === 'vertical'
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
				...(isExploded ? getExplodeLayerTransform(mergedConfig.layerIndex || 3) : {}),
			}}
			data-layer-active={activeLayer === 'scanlines' || null}
		/>
	);
}

// Estilos globales necesarios para las animaciones
const GlobalStyles = () => (
	<style jsx global>{`
    @keyframes scanlines-horizontal {
      0% { background-position: 0 0; }
      100% { background-position: 0 100%; }
    }

    @keyframes scanlines-vertical {
      0% { background-position: 0 0; }
      100% { background-position: 100% 0; }
    }

    @keyframes scanlines-diagonal {
      0% { background-position: 0 0; }
      100% { background-position: 100% 100%; }
    }

    .animate-scanlines-horizontal {
      animation: scanlines-horizontal 30s linear infinite;
    }

    .animate-scanlines-vertical {
      animation: scanlines-vertical 30s linear infinite;
    }

    .animate-scanlines-diagonal {
      animation: scanlines-diagonal 30s linear infinite;
    }
  `}</style>
);

// Exportar el componente con los estilos globales
export default function ScanlinesEffectLayerWithStyles(props: LayerComponentProps<ScanlinesConfig>) {
	return (
		<>
			<GlobalStyles />
			<ScanlinesEffectLayer {...props} />
		</>
	);
}
