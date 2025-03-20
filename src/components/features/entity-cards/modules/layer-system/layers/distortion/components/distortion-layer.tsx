'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useDistortionStore } from '../actions/distortion-config.action';
import { generateDistortionEffects } from '../utils/distortion-utils';

interface DistortionLayerProps {
	className?: string;
	width: number;
	height: number;
	isExploded?: boolean;
	isHovered?: boolean;
	activeLayer?: string | null;
}

export const DistortionLayer: React.FC<DistortionLayerProps> = ({
	className,
	width,
	height,
	isExploded = false,
	isHovered = false,
	activeLayer = null,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>(0);
	const timeRef = useRef<number>(0);

	const { config } = useDistortionStore();

	// Generar efectos de distorsión
	const generateEffects = useCallback(() => {
		if (!canvasRef.current) return;

		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) return;

		// Limpiar canvas
		ctx.clearRect(0, 0, width, height);

		// Generar nuevos efectos
		generateDistortionEffects(ctx, {
			width,
			height,
			intensity: config.intensity,
			glitchEffect: config.glitchEffect,
			chromaticAberration: config.chromaticAberration,
			pixelate: config.pixelate,
			time: timeRef.current,
		});
	}, [config, width, height]);

	// Manejar animación
	useEffect(() => {
		if (!config.enabled) return;

		// Solo animar si algún efecto está habilitado y animado
		const shouldAnimate =
			(config.glitchEffect.enabled && config.glitchEffect.visibleOnHover) ||
			(config.chromaticAberration.enabled && config.chromaticAberration.visibleOnHover) ||
			(config.pixelate.enabled && config.pixelate.visibleOnHover);

		if (!shouldAnimate) return;

		const animate = (timestamp: number) => {
			timeRef.current = timestamp * 0.001;
			generateEffects();
			animationFrameRef.current = requestAnimationFrame(animate);
		};

		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(animationFrameRef.current);
		};
	}, [config, generateEffects]);

	// Generar efectos iniciales o cuando cambia la configuración
	useEffect(() => {
		if (!config.enabled) return;
		generateEffects();
	}, [config, generateEffects]);

	// Si no está habilitado, no renderizar nada
	if (!config.enabled) return null;

	// Si solo debe mostrarse en hover y no está en hover, no renderizar
	if (config.visibleOnHover && !isHovered) return null;

	// Calcular opacidad basada en hover
	const opacity = isHovered ? 1 : 0.7;

	return (
		<motion.canvas
			ref={canvasRef}
			className={cn(
				'absolute inset-0 pointer-events-none',
				{
					'mix-blend-normal': config.blend === 'normal',
					'mix-blend-multiply': config.blend === 'multiply',
					'mix-blend-screen': config.blend === 'screen',
					'mix-blend-overlay': config.blend === 'overlay',
					'mix-blend-color-dodge': config.blend === 'color-dodge',
					'exploded-layer layer-distortion': isExploded,
					'active-layer': activeLayer === 'distortion',
				},
				className
			)}
			initial={{ opacity: 0 }}
			animate={{ opacity }}
			transition={{ duration: 0.3 }}
			style={{
				width: `${width}px`,
				height: `${height}px`,
				...(isExploded ? { zIndex: config.layerIndex } : {}),
			}}
			width={width}
			height={height}
			data-layer-id="distortion"
			data-layer-active={activeLayer === 'distortion' || null}
		/>
	);
};