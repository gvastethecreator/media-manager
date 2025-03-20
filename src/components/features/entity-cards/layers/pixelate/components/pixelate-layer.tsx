import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { usePixelateStore } from '../actions/pixelate-config.action';
import { applyPixelateEffect, generateAnimationPattern } from '../utils/pixelate-utils';

interface PixelateLayerProps {
	className?: string;
	width: number;
	height: number;
	sourceImage?: string;
}

export const PixelateLayer: React.FC<PixelateLayerProps> = ({
	className,
	width,
	height,
	sourceImage,
}) => {
	const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
	const targetCanvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>(0);
	const timeRef = useRef<number>(0);

	const { config } = usePixelateStore();

	// Cargar imagen fuente en el canvas
	useEffect(() => {
		if (!sourceImage || !sourceCanvasRef.current) return;

		const canvas = sourceCanvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = sourceImage;
		img.onload = () => {
			canvas.width = width;
			canvas.height = height;
			ctx.drawImage(img, 0, 0, width, height);
		};
	}, [sourceImage, width, height]);

	// Aplicar efecto de pixelado
	useEffect(() => {
		if (!config.enabled || !sourceCanvasRef.current || !targetCanvasRef.current) return;

		const animate = (timestamp: number) => {
			if (!sourceCanvasRef.current || !targetCanvasRef.current) return;

			// Actualizar tiempo para animaciones
			timeRef.current = timestamp * 0.001 * config.animationSpeed;

			// Aplicar efecto
			applyPixelateEffect(sourceCanvasRef.current, targetCanvasRef.current, {
				...config,
				pixelSize: config.animated
					? generateAnimationPattern(
						width,
						height,
						config.animationPattern,
						timeRef.current
					)[0][0]
					: config.pixelSize,
			});

			// Continuar animación si está habilitada
			if (config.animated) {
				animationFrameRef.current = requestAnimationFrame(animate);
			}
		};

		if (config.animated) {
			animationFrameRef.current = requestAnimationFrame(animate);
		} else {
			animate(0);
		}

		return () => {
			cancelAnimationFrame(animationFrameRef.current);
		};
	}, [config, width, height]);

	// Si no está habilitado o no hay imagen fuente, no renderizar nada
	if (!config.enabled || !sourceImage) return null;

	return (
		<>
			{/* Canvas fuente (oculto) */}
			<canvas
				ref={sourceCanvasRef}
				style={{ display: 'none' }}
				width={width}
				height={height}
			/>

			{/* Canvas de destino (visible) */}
			<motion.canvas
				ref={targetCanvasRef}
				className={cn(
					'absolute inset-0 pointer-events-none',
					{
						'mix-blend-normal': config.blendMode === 'normal',
						'mix-blend-multiply': config.blendMode === 'multiply',
						'mix-blend-screen': config.blendMode === 'screen',
						'mix-blend-overlay': config.blendMode === 'overlay',
					},
					className
				)}
				initial={{ opacity: 0 }}
				animate={{ opacity: config.opacity }}
				transition={{ duration: 0.3 }}
				style={{
					width: `${width}px`,
					height: `${height}px`,
				}}
			/>
		</>
	);
};