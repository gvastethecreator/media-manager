'use client';

import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import type { NoiseConfig } from '../noise-schema';
import { generateNoise } from '../utils/noise-utils';

interface NoiseLayerProps {
	processedConfig: NoiseConfig;
	style: React.CSSProperties;
	isVisible: boolean;
	width: number;
	height: number;
	sourceCanvas: HTMLCanvasElement;
}

/**
 * 🌊 Componente interno de ruido
 */
const NoiseLayerComponent = ({
	processedConfig,
	style,
	isVisible,
	width,
	height,
	sourceCanvas,
}: NoiseLayerProps) => {
	// Referencias y estado
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>();

	// 🎨 Aplicar el efecto de ruido
	const renderNoise = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !isVisible) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Obtener datos de la imagen original
		const sourceCtx = sourceCanvas.getContext('2d');
		if (!sourceCtx) return;

		const imageData = sourceCtx.getImageData(0, 0, width, height);

		// Aplicar el efecto de ruido
		const noisedData = generateNoise(imageData, processedConfig, processedConfig.animated ? Date.now() : 0);

		// Dibujar el resultado
		ctx.putImageData(noisedData, 0, 0);

		// Continuar animación si está habilitada
		if (processedConfig.animated) {
			animationFrameRef.current = requestAnimationFrame(renderNoise);
		}
	}, [processedConfig, isVisible, width, height, sourceCanvas]);

	// 🔄 Inicializar y limpiar animación
	useEffect(() => {
		if (isVisible) {
			renderNoise();
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [isVisible, renderNoise]);

	// 📏 Manejar redimensionamiento
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = width * dpr;
		canvas.height = height * dpr;

		renderNoise();
	}, [width, height, renderNoise]);

	// 🎨 Calcular los estilos del canvas
	const canvasStyle = useMemo(() => ({
		...style,
		width: `${width}px`,
		height: `${height}px`,
	}), [style, width, height]);

	return (
		<motion.canvas
			ref={canvasRef}
			style={canvasStyle}
			className="absolute inset-0 pointer-events-none"
			initial={{ opacity: 0 }}
			animate={{ opacity: isVisible ? 1 : 0 }}
			transition={{ duration: 0.3 }}
		/>
	);
};

/**
 * 🌊 Capa de ruido con funcionalidad base
 */
export const NoiseLayer = withBaseLayer<NoiseConfig>(NoiseLayerComponent);