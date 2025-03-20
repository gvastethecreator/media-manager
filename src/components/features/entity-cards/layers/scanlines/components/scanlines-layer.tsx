'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import type { CommonLayerProps } from '../../types';
import type { ScanlinesConfig } from '../actions/scanlines-config.action';
import { useScanlines } from '../hooks/use-scanlines';

interface ScanlinesLayerProps extends CommonLayerProps {
	config: ScanlinesConfig;
}

export const ScanlinesLayer: React.FC<ScanlinesLayerProps> = ({
	config,
	isHovered,
	isExploded,
	activeLayer,
	getExplodeLayerTransform,
	style,
}) => {
	// 🎯 Determinar si la capa debe renderizarse
	const shouldRender = useMemo(() => {
		if (!config.enabled) return false;
		if (config.visibleOnHover && !isHovered) return false;
		return true;
	}, [config.enabled, config.visibleOnHover, isHovered]);

	// 🎨 Usar el hook de líneas de escaneo
	const { canvasRef, error, initializeCanvas, renderScanlines } = useScanlines({
		config,
		shouldRender,
	});

	// 🔄 Inicializar el canvas cuando el componente se monta
	useEffect(() => {
		if (shouldRender) {
			initializeCanvas();
		}
	}, [shouldRender, initializeCanvas]);

	// ❌ Si hay un error, no renderizar nada
	if (error) {
		console.error('Error en ScanlinesLayer:', error);
		return null;
	}

	// 🎭 Calcular las propiedades de animación
	const motionProps = useMemo(() => {
		const baseProps = {
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			exit: { opacity: 0 },
			transition: { duration: 0.3 },
		};

		if (isExploded && activeLayer !== null) {
			return {
				...baseProps,
				...getExplodeLayerTransform(config.layerIndex),
			};
		}

		return baseProps;
	}, [isExploded, activeLayer, config.layerIndex, getExplodeLayerTransform]);

	// 🎨 Calcular los estilos del canvas
	const canvasStyle = useMemo(() => ({
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		pointerEvents: 'none',
		mixBlendMode: config.blendMode as any,
		...style,
	}), [config.blendMode, style]);

	// 🎨 Renderizar la capa
	return shouldRender ? (
		<motion.div
			className="absolute inset-0 w-full h-full"
			{...motionProps}
		>
			<canvas
				ref={canvasRef}
				style={canvasStyle}
				aria-hidden="true"
			/>
		</motion.div>
	) : null;
};