/**
 * 🎨 Componente base para todas las capas
 * @module BaseLayer
 */

'use client';

import { motion } from 'motion/react';
import * as React from 'react';
import { useBaseLayer } from '../hooks/use-base-layer';
import type { BaseLayerConfig } from '../layer-config-base';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import type { CommonLayerProps } from '../types';
import type { ExplodeLayerTransformFunction } from '../../../types/base-card-types';

interface BaseLayerProps<T extends BaseLayerConfig> {
	config: T;
	defaultConfig: T;
	isHovered?: boolean;
	isExploded?: boolean;
	mousePosition?: { x: number; y: number };
	activeLayer: string | null;
	layerId: string;
	children: (props: {
		isVisible: boolean;
		safeMousePosition: { x: number; y: number };
		processedConfig: T;
		isActive: boolean;
		style: React.CSSProperties;
	}) => React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
	onMouseEnter?: (event: React.MouseEvent) => void;
	onMouseLeave?: (event: React.MouseEvent) => void;
	onMouseMove?: (event: React.MouseEvent) => void;
}

/**
 * 🎭 Componente base para implementar capas visuales
 */
export function BaseLayer<T extends BaseLayerConfig>({
	config,
	defaultConfig,
	isHovered,
	isExploded,
	mousePosition,
	activeLayer,
	layerId,
	children,
	className,
	style,
	onMouseEnter,
	onMouseLeave,
	onMouseMove,
}: BaseLayerProps<T>): React.ReactElement {
	// Usar el hook base para la lógica común
	const { processedConfig, isVisible, safeMousePosition, getTransform, isActive } = useBaseLayer({
		config,
		defaultConfig,
		isHovered,
		isExploded,
		mousePosition,
		activeLayer,
		layerId,
	});

	// Calcular estilos base
	const baseStyle: React.CSSProperties = React.useMemo(
		() => ({
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			pointerEvents: isVisible ? 'auto' : 'none',
			opacity: isVisible ? 1 : 0,
			...getTransform(processedConfig.layerIndex),
			...style,
		}),
		[isVisible, processedConfig.layerIndex, style, getTransform]
	);

	// Configurar animaciones con Framer Motion
	const variants = {
		hidden: { opacity: 0, scale: 0.8 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: {
				type: 'spring',
				stiffness: 300,
				damping: 30,
			},
		},
		active: {
			scale: 1.05,
			boxShadow: '0 0 20px rgba(0,0,0,0.2)',
			transition: {
				type: 'spring',
				stiffness: 400,
				damping: 40,
			},
		},
	};

	return (
		<motion.div
			className={className}
			style={baseStyle}
			initial="hidden"
			animate={isActive ? 'active' : isVisible ? 'visible' : 'hidden'}
			variants={variants}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onMouseMove={onMouseMove}
			layoutId={layerId}
		>
			{children({
				isVisible,
				safeMousePosition,
				processedConfig,
				isActive,
				style: baseStyle,
			})}
		</motion.div>
	);
}

interface WithBaseLayerProps {
	config: BaseLayerConfig;
	isExploded?: boolean;
	isHovered?: boolean;
	getExplodeLayerTransform?: ExplodeLayerTransformFunction;
	activeLayer?: string | null;
	className?: string;
}

/**
 * 🧩 High Order Component para añadir funcionalidad base a cualquier capa
 */
export function withBaseLayer<T extends BaseLayerConfig>(
	Component: React.ComponentType<{
		processedConfig: T;
		style: React.CSSProperties;
		isVisible: boolean;
	}>
) {
	return function BaseLayerWrapper({
		config,
		isExploded = false,
		isHovered = false,
		getExplodeLayerTransform,
		activeLayer,
		className,
	}: WithBaseLayerProps) {
		// Estado para procesar la configuración
		const [processedConfig, setProcessedConfig] = useState<T>(config as T);

		// Efecto para procesar la configuración cuando cambia
		useEffect(() => {
			setProcessedConfig(config as T);
		}, [config]);

		// Si la capa no está habilitada, no renderizar nada
		if (!processedConfig.enabled) {
			return null;
		}

		// Determinar si la capa debe ser visible
		const shouldBeVisible = useMemo(() => {
			// Si es visible solo al hover, verificar el estado de hover
			if (processedConfig.visibleOnHover) {
				return isHovered;
			}

			// En caso contrario, siempre visible
			return true;
		}, [processedConfig.visibleOnHover, isHovered]);

		// Calcular el estilo según el modo explotado y la configuración
		const layerStyle = useMemo(() => {
			const style: React.CSSProperties = {
				position: 'absolute',
				inset: 0,
				zIndex: processedConfig.layerIndex || 0,
				opacity: processedConfig.opacity,
				pointerEvents: 'none',
			};

			// Si está en modo explotado y existe la función para obtener el transform, aplicarlo
			if (isExploded && getExplodeLayerTransform) {
				const explodeTransform = getExplodeLayerTransform(processedConfig.layerIndex || 0);
				return { ...style, ...explodeTransform };
			}

			return style;
		}, [isExploded, getExplodeLayerTransform, processedConfig]);

		return (
			<div
				className={cn(
					'layer',
					isExploded && 'exploded-layer',
					activeLayer === (processedConfig as any).type && 'active-layer',
					className
				)}
				data-layer-type={(processedConfig as any).type}
				data-layer-index={processedConfig.layerIndex}
			>
				<Component processedConfig={processedConfig} style={layerStyle} isVisible={shouldBeVisible} />
			</div>
		);
	};
}
