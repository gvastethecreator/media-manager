/**
 * 🎨 Componente base para todas las capas
 * @module BaseLayer
 */

import { motion } from 'framer-motion';
import * as React from 'react';
import { useBaseLayer } from '../hooks/use-base-layer';
import type { BaseLayerConfig } from '../types';

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
	const {
		processedConfig,
		isVisible,
		safeMousePosition,
		getTransform,
		isActive,
	} = useBaseLayer({
		config,
		defaultConfig,
		isHovered,
		isExploded,
		mousePosition,
		activeLayer,
		layerId,
	});

	// Calcular estilos base
	const baseStyle = React.useMemo(() => ({
		position: 'absolute' as const,
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		pointerEvents: isVisible ? 'auto' : 'none',
		opacity: isVisible ? 1 : 0,
		...getTransform(processedConfig.layerIndex),
		...style,
	}), [isVisible, processedConfig.layerIndex, style]);

	// Configurar animaciones con Framer Motion
	const variants = {
		hidden: { opacity: 0, scale: 0.8 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: {
				type: "spring",
				stiffness: 300,
				damping: 30
			}
		},
		active: {
			scale: 1.05,
			boxShadow: "0 0 20px rgba(0,0,0,0.2)",
			transition: {
				type: "spring",
				stiffness: 400,
				damping: 40
			}
		}
	};

	return (
		<motion.div
			className={className}
			style={baseStyle}
			initial="hidden"
			animate={isActive ? "active" : isVisible ? "visible" : "hidden"}
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

// HOC para crear capas con el componente base
export function withBaseLayer<T extends BaseLayerConfig, P extends object>(
	WrappedComponent: React.ComponentType<P & {
		isVisible: boolean;
		safeMousePosition: { x: number; y: number };
		processedConfig: T;
		isActive: boolean;
		style: React.CSSProperties;
	}>
) {
	return function WithBaseLayerComponent(props: P & BaseLayerProps<T>) {
		const { children, ...rest } = props;
		return (
			<BaseLayer {...rest}>
				{(layerProps) => <WrappedComponent {...props} {...layerProps} />}
			</BaseLayer>
		);
	};
}