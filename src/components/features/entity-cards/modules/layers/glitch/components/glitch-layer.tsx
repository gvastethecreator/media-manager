'use client';

import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import type { GlitchConfig } from '../glitch-schema';
import { generateGlitch } from '../utils/glitch-utils';

interface GlitchLayerProps {
	processedConfig: GlitchConfig;
	style: React.CSSProperties;
	isVisible: boolean;
	width: number;
	height: number;
	sourceCanvas: HTMLCanvasElement;
}

/**
 * 🌟 Componente interno de glitch
 */
const GlitchLayerComponent = ({ processedConfig, style, isVisible, width, height, sourceCanvas }: GlitchLayerProps) => {
	// Referencias y estado
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>();
	const lastUpdateRef = useRef<number>(0);

	// 🎨 Aplicar el efecto de glitch
	const renderGlitch = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !isVisible) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Obtener datos de la imagen original
		const sourceCtx = sourceCanvas.getContext('2d');
		if (!sourceCtx) return;

		const imageData = sourceCtx.getImageData(0, 0, width, height);

		// Aplicar el efecto de glitch
		const now = Date.now();
		const glitchedData = generateGlitch(imageData, processedConfig, processedConfig.animation ? now : 0);

		// Dibujar el resultado
		ctx.putImageData(glitchedData, 0, 0);

		// Continuar animación si está configurada
		if (processedConfig.animation) {
			const { frequency } = processedConfig.animation;
			const timeSinceLastUpdate = now - lastUpdateRef.current;

			if (timeSinceLastUpdate >= 1000 / frequency) {
				lastUpdateRef.current = now;
			}

			animationFrameRef.current = requestAnimationFrame(renderGlitch);
		}
	}, [processedConfig, isVisible, width, height, sourceCanvas]);

	// 🔄 Inicializar y limpiar animación
	useEffect(() => {
		if (isVisible) {
			renderGlitch();
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [isVisible, renderGlitch]);

	// 📏 Manejar redimensionamiento
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = width * dpr;
		canvas.height = height * dpr;

		renderGlitch();
	}, [width, height, renderGlitch]);

	// 🎨 Calcular los estilos del canvas
	const canvasStyle = useMemo(
		() => ({
			...style,
			width: `${width}px`,
			height: `${height}px`,
		}),
		[style, width, height]
	);

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
 * 🌟 Capa de glitch con funcionalidad base
 */
export const GlitchLayer = withBaseLayer<GlitchConfig>(GlitchLayerComponent);
