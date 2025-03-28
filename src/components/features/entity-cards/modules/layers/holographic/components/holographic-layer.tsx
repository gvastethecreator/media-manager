'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useHolographicStore } from '../actions/holographic-config.action';
import { generateHolographicEffect } from '../utils/holographic-utils';

interface HolographicLayerProps {
	className?: string;
	width: number;
	height: number;
	isExploded?: boolean;
	isHovered?: boolean;
	activeLayer?: string | null;
}

export const HolographicLayer: React.FC<HolographicLayerProps> = ({
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

	const { config } = useHolographicStore();

	// Generar efecto holográfico
	const generateEffect = useCallback(() => {
		if (!canvasRef.current) return;

		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) return;

		// Limpiar canvas
		ctx.clearRect(0, 0, width, height);

		// Generar nuevo efecto
		generateHolographicEffect(ctx, {
			width,
			height,
			intensity: config.intensity,
			frequency: config.frequency,
			rainbow: config.rainbow,
			rainbowSpeed: config.rainbowSpeed,
			rainbowSaturation: config.rainbowSaturation,
			rainbowBrightness: config.rainbowBrightness,
			iridescence: config.iridescence,
			iridescenceAmount: config.iridescenceAmount,
			metallic: config.metallic,
			metallicAmount: config.metallicAmount,
			reflection: config.reflection,
			reflectionAmount: config.reflectionAmount,
			grain: config.grain,
			grainAmount: config.grainAmount,
			time: timeRef.current,
		});
	}, [config, width, height]);

	// Manejar animación
	useEffect(() => {
		if (!config.enabled || !config.animated) return;

		const animate = (timestamp: number) => {
			timeRef.current = timestamp * 0.001 * config.speed;
			generateEffect();
			animationFrameRef.current = requestAnimationFrame(animate);
		};

		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(animationFrameRef.current);
		};
	}, [config.enabled, config.animated, config.speed, generateEffect]);

	// Generar efecto inicial o cuando cambia la configuración
	useEffect(() => {
		if (!config.enabled || config.animated) return;
		generateEffect();
	}, [config, generateEffect]);

	// Si no está habilitado, no renderizar nada
	if (!config.enabled) return null;

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
					'exploded-layer layer-holographic': isExploded,
					'active-layer': activeLayer === 'holographic',
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
			data-layer-id="holographic"
			data-layer-active={activeLayer === 'holographic' || null}
		/>
	);
};
