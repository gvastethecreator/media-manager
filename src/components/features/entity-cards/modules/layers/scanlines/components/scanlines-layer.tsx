'use client';

import { motion } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import { useScanlines } from '../hooks/use-scanlines';
import type { ScanlinesConfig } from '../scanlines-config-types';

/**
 * 📺 Componente interno de líneas de escaneo
 */
const ScanlinesLayerComponent = ({
	processedConfig,
	style,
	isVisible,
}: {
	processedConfig: ScanlinesConfig;
	style: React.CSSProperties;
	isVisible: boolean;
}) => {
	// 🎨 Usar el hook de líneas de escaneo
	const { canvasRef, error, initializeCanvas } = useScanlines({
		config: processedConfig,
		shouldRender: isVisible,
	});

	// 🔄 Inicializar el canvas cuando el componente se monta
	useEffect(() => {
		if (isVisible) {
			initializeCanvas();
		}
	}, [isVisible, initializeCanvas]);

	// ❌ Si hay un error, no renderizar nada
	if (error) {
		console.error('Error en ScanlinesLayer:', error);
		return null;
	}

	// 🎨 Calcular los estilos del canvas
	const canvasStyle = useMemo(
		() => ({
			...style,
			mixBlendMode: processedConfig.blendMode as React.CSSProperties['mixBlendMode'],
		}),
		[processedConfig.blendMode, style]
	);

	return (
		<motion.canvas
			ref={canvasRef}
			style={canvasStyle}
			aria-hidden="true"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		/>
	);
};

/**
 * 📺 Capa de líneas de escaneo con funcionalidad base
 */
export const ScanlinesLayer = withBaseLayer<ScanlinesConfig>(ScanlinesLayerComponent);
