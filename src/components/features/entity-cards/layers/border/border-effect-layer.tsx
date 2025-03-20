'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';
import { memo, useMemo } from 'react';
import type { LayerConfig, LayerRenderProps } from '../types';

export interface BorderConfig extends LayerConfig {
	width: number;
	style: 'solid' | 'dashed' | 'dotted' | 'double';
	color: string;
	radius?: number;
	animated?: boolean;
	animationType?: 'none' | 'pulse' | 'flow' | 'rainbow';
	animationSpeed?: number;
	glowAmount?: number;
	opacity?: number;
	gradient?: string[];
	dashPattern?: number[];
	cornerStyle?: 'round' | 'bevel' | 'miter';
	borderImage?: string;
}

/**
 * BorderEffectLayer - Componente que añade un borde personalizable a la tarjeta.
 * Soporta diferentes estilos, animaciones y efectos.
 */
export const BorderEffectLayer = memo(function BorderEffectLayer({
	isExploded,
	isHovered = false,
	mousePosition = { x: 0, y: 0 },
	isActive,
	config,
	entityType,
	entityId,
}: LayerRenderProps) {
	// Valores por defecto
	const defaultConfig: BorderConfig = useMemo(() => ({
		enabled: true,
		width: 2,
		style: 'solid',
		color: '#ffffff',
		radius: 8,
		animated: false,
		animationType: 'none',
		animationSpeed: 1,
		glowAmount: 0,
		opacity: 1,
		cornerStyle: 'round',
		layerIndex: 2,
	}), []);

	// Combinar configuración con valores por defecto
	const mergedConfig = useMemo(() => ({ ...defaultConfig, ...config }) as BorderConfig, [defaultConfig, config]);

	// Si no está habilitado, no renderizar nada
	if (!mergedConfig.enabled) {
		return null;
	}

	// Generar estilos CSS para el borde
	const borderStyles = useMemo(() => {
		const styles: React.CSSProperties = {
			borderWidth: `${mergedConfig.width}px`,
			borderStyle: mergedConfig.style,
			borderColor: mergedConfig.color,
			borderRadius: mergedConfig.radius ? `${mergedConfig.radius}px` : undefined,
			opacity: mergedConfig.opacity,
		};

		// Aplicar estilo de esquina
		if (mergedConfig.cornerStyle) {
			styles.borderRadius = mergedConfig.cornerStyle === 'round' ? `${mergedConfig.radius || 8}px` : '0';
		}

		// Aplicar imagen de borde si existe
		if (mergedConfig.borderImage) {
			styles.borderImage = mergedConfig.borderImage;
		}

		// Aplicar gradiente si existe
		if (mergedConfig.gradient && mergedConfig.gradient.length > 0) {
			styles.borderImage = `linear-gradient(to right, ${mergedConfig.gradient.join(', ')}) 1`;
		}

		// Aplicar patrón de guiones si es necesario
		if (mergedConfig.style === 'dashed' && mergedConfig.dashPattern && mergedConfig.dashPattern.length > 0) {
			styles.borderStyle = 'dashed';
			styles.borderWidth = `${mergedConfig.width}px`;
		}

		// Aplicar efecto de brillo si está configurado
		if (mergedConfig.glowAmount && mergedConfig.glowAmount > 0) {
			styles.boxShadow = `0 0 ${mergedConfig.glowAmount}px ${mergedConfig.color}`;
		}

		return styles;
	}, [mergedConfig]);

	// Generar clases CSS para animaciones
	const animationClasses = useMemo(() => {
		if (!mergedConfig.animated || mergedConfig.animationType === 'none') {
			return '';
		}

		switch (mergedConfig.animationType) {
			case 'pulse':
				return 'animate-pulse-border';
			case 'flow':
				return 'animate-flow-border';
			case 'rainbow':
				return 'animate-rainbow-border';
			default:
				return '';
		}
	}, [mergedConfig.animated, mergedConfig.animationType]);

	// Calcular transformación para modo explotado
	const explodedStyles = useMemo(() => {
		if (!isExploded) return {};
		return {
			transform: `translate3d(${20 * mergedConfig.layerIndex}px, ${20 * mergedConfig.layerIndex}px, 0)`,
			transition: 'transform 0.3s ease-in-out'
		};
	}, [isExploded, mergedConfig.layerIndex]);

	return (
		<div
			className={cn(
				'absolute inset-0 pointer-events-none z-10',
				animationClasses,
				isExploded ? 'exploded-layer layer-border' : ''
			)}
			style={{
				...borderStyles,
				...explodedStyles,
			}}
			data-layer-active={isActive || null}
			data-testid="border-effect-layer"
		/>
	);
});

// Estilos globales necesarios para las animaciones
const GlobalStyles = () => (
	<style jsx global>{`
		@keyframes pulse-border {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.6;
			}
		}

		@keyframes flow-border {
			0% {
				border-color: var(--border-color, #ffffff);
			}
			50% {
				border-color: transparent;
			}
			100% {
				border-color: var(--border-color, #ffffff);
			}
		}

		@keyframes rainbow-border {
			0% {
				border-color: #ff0000;
			}
			16.6% {
				border-color: #ff8000;
			}
			33.3% {
				border-color: #ffff00;
			}
			50% {
				border-color: #00ff00;
			}
			66.6% {
				border-color: #0000ff;
			}
			83.3% {
				border-color: #8000ff;
			}
			100% {
				border-color: #ff0000;
			}
		}

		.animate-pulse-border {
			animation: pulse-border 2s infinite ease-in-out;
		}

		.animate-flow-border {
			animation: flow-border 2s infinite ease-in-out;
			--border-color: inherit;
		}

		.animate-rainbow-border {
			animation: rainbow-border 6s infinite linear;
		}
	`}</style>
);

// Exportar el componente con los estilos globales
export default memo(function BorderEffectLayerWithStyles(props: LayerRenderProps) {
	return (
		<>
			<GlobalStyles />
			<BorderEffectLayer {...props} />
		</>
	);
});
