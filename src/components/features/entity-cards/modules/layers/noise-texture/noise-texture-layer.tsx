'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';
import type { NoiseTextureConfig } from './actions/noise-texture-config.action';
import { generateNoiseMap, noiseCache, noiseMapToImageData } from './utils/noise-algorithms';

interface NoiseTextureLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	config: NoiseTextureConfig;
}

export function NoiseTextureLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: NoiseTextureLayerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [_isMounted, setIsMounted] = useState(false);
	const animationRef = useRef<number>();
	const [shouldRender, setShouldRender] = useState(true);

	// Extraer configuración
	const {
		enabled = true,
		visibleOnHover = true,
		opacity = 0.1,
		density = 0.6,
		pattern = 'fractalNoise',
		scale = 1,
		octaves = 3,
		seed = 42,
		animated = false,
		animationSpeed = 1,
		color = 'rgba(255, 255, 255, 0.5)',
		intensity = 0.5,
		blendMode = 'overlay',
	} = config;

	// Determinar si debemos renderizar el componente
	useEffect(() => {
		if (!enabled) {
			setShouldRender(false);
			return;
		}

		if (visibleOnHover && !isHovered) {
			setShouldRender(false);
			return;
		}

		setShouldRender(true);
	}, [enabled, visibleOnHover, isHovered]);

	// Renderizar el ruido en el canvas cuando cambie la configuración
	useEffect(() => {
		if (!canvasRef.current || !shouldRender) {
			return;
		}

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return;
		}

		// Ajustar tamaño del canvas
		const updateCanvasSize = () => {
			const rect = canvas.getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;
			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;

			// Escalar contexto para alta resolución
			ctx.scale(dpr, dpr);
		};

		updateCanvasSize();
		setIsMounted(true);

		// Renderizar el ruido
		const renderNoise = (time = 0) => {
			if (!ctx || !canvas) {
				return;
			}

			// Tamaño del mapa de ruido (optimizado para rendimiento)
			const mapWidth = Math.ceil(canvas.width / 4);
			const mapHeight = Math.ceil(canvas.height / 4);

			// Usar semilla animada si está activado
			const animatedSeed = animated ? seed + time * animationSpeed * 0.001 : seed;

			// Obtener mapa de ruido del caché o generarlo
			const noiseMap = noiseCache.get(mapWidth, mapHeight, pattern as 'perlin' | 'simplex' | 'fractalNoise', {
				seed: animatedSeed,
				scale,
				octaves,
				persistence: density,
			});

			// Convertir a ImageData
			const imageData = noiseMapToImageData(noiseMap, color, intensity);

			// Crear un bitmap temporal y dibujarlo en el canvas
			createImageBitmap(imageData).then((bitmap) => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.globalAlpha = opacity;
				ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
				ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, canvas.width, canvas.height);
				bitmap.close();

				// Si es animado, continuar animación
				if (animated) {
					animationRef.current = requestAnimationFrame(renderNoise);
				}
			});
		};

		if (animated) {
			animationRef.current = requestAnimationFrame(renderNoise);
		} else {
			renderNoise();
		}

		// Limpiar animación al desmontar
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		density,
		opacity,
		pattern,
		scale,
		octaves,
		seed,
		animated,
		animationSpeed,
		color,
		intensity,
		blendMode,
		shouldRender,
	]);

	// Ajustar tamaño cuando cambie la ventana
	useEffect(() => {
		const handleResize = () => {
			setIsMounted(false);
			setTimeout(() => setIsMounted(true), 0);
		};

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	// Si no debemos renderizar, retornar null
	if (!shouldRender) {
		return null;
	}

	return (
		<motion.div
			className={cn('absolute inset-0 pointer-events-none', isExploded ? 'exploded-layer' : '')}
			style={{
				...(isExploded ? getExplodeLayerTransform(3) : {}),
				zIndex: 15,
			}}
			initial={{ opacity: 0 }}
			animate={{
				opacity: 1,
				scale: activeLayer === 'noiseTexture' && isExploded ? 1.05 : 1,
			}}
			data-layer-active={activeLayer === 'noiseTexture' || null}
		>
			<canvas
				ref={canvasRef}
				className="w-full h-full"
				style={{
					mixBlendMode: blendMode as any,
				}}
			/>
		</motion.div>
	);
}
