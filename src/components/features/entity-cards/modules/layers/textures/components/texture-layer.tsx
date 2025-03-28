'use client';

import { motion } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import type { CommonLayerProps } from '../../types';
import { useTexture } from '../hooks/use-texture';
import type { TextureConfig } from '../texture-config-types';

interface TextureLayerProps extends CommonLayerProps {
	config: TextureConfig;
}

/**
 * 🖼️ Componente interno de textura
 */
const TextureLayerComponent = ({
	processedConfig,
	style,
	isVisible,
}: {
	processedConfig: TextureConfig;
	style: React.CSSProperties;
	isVisible: boolean;
}) => {
	// 🎨 Usar el hook de textura
	const { canvasRef, error, initializeCanvas, renderTexture } = useTexture({
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
		console.error('Error en TextureLayer:', error);
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
 * 🖼️ Capa de textura con funcionalidad base
 */
export const TextureLayer = withBaseLayer<TextureConfig>(TextureLayerComponent);
