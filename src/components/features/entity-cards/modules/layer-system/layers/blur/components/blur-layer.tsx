'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import type { BlurConfig } from '../blur-schema';
import { applyBlurEffect } from '../utils/blur-utils';

interface BlurLayerProps {
	processedConfig: BlurConfig;
	style: React.CSSProperties;
	isVisible: boolean;
	width: number;
	height: number;
	sourceCanvas: HTMLCanvasElement;
}

/**
 * 🌫️ Componente interno de desenfoque
 */
const BlurLayerComponent = ({
	processedConfig,
	style,
	isVisible,
	width,
	height,
	sourceCanvas,
}: BlurLayerProps) => {
	// Referencias y estado
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>();

	// 🎨 Aplicar el efecto de desenfoque
	const renderBlur = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !isVisible) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Obtener datos de la imagen original
		const sourceCtx = sourceCanvas.getContext('2d');
		if (!sourceCtx) return;

		const imageData = sourceCtx.getImageData(0, 0, width, height);

		// Aplicar el efecto de desenfoque
		const blurredData = applyBlurEffect(imageData, {
			radius: processedConfig.radius,
			algorithm: processedConfig.algorithm,
			quality: processedConfig.quality,
			zone: processedConfig.zone,
			motion: processedConfig.motion,
			preserveEdges: processedConfig.preserveEdges,
			edgeThreshold: processedConfig.edgeThreshold,
			time: processedConfig.animated ? Date.now() : 0,
			animationSpeed: processedConfig.animationSpeed,
		});

		// Dibujar el resultado
		ctx.putImageData(blurredData, 0, 0);

		// Continuar animación si está habilitada
		if (processedConfig.animated) {
			animationFrameRef.current = requestAnimationFrame(renderBlur);
		}
	}, [processedConfig, isVisible, width, height, sourceCanvas]);

	// 🔄 Inicializar y limpiar animación
	useEffect(() => {
		if (isVisible) {
			renderBlur();
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [isVisible, renderBlur]);

	// 📏 Manejar redimensionamiento
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = width * dpr;
		canvas.height = height * dpr;

		renderBlur();
	}, [width, height, renderBlur]);

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
 * 🌫️ Capa de desenfoque con funcionalidad base
 */
export const BlurLayer = withBaseLayer<BlurConfig>(BlurLayerComponent);