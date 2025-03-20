/**
 * 🌫️ Componente que renderiza una capa de textura de ruido
 * @component
 */
'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExplodeLayerTransformFunction } from '../../../../types/base-card-types';
import type { NoiseTextureConfig } from './actions/noise-texture-config.action';
import { noiseCache, noiseMapToImageData } from './utils/noise-algorithms';

interface NoiseTextureLayerProps {
	/** Estado de explosión de la capa */
	isExploded: boolean;
	/** Estado de hover de la capa */
	isHovered: boolean;
	/** Capa actualmente activa */
	activeLayer: string | null;
	/** Función para obtener la transformación de explosión */
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	/** Configuración de la textura de ruido */
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
	const contextRef = useRef<CanvasRenderingContext2D | null>(null);
	const animationRef = useRef<number>();
	const [error, setError] = useState<string | null>(null);
	const [shouldRender, setShouldRender] = useState(true);

	// Extraer configuración con valores por defecto
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
		setShouldRender(enabled && (!visibleOnHover || isHovered));
	}, [enabled, visibleOnHover, isHovered]);

	// Inicializar contexto del canvas
	const initializeCanvas = useCallback(() => {
		if (!canvasRef.current) {
			setError('Canvas no disponible');
			return false;
		}

		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) {
			setError('Contexto 2D no disponible');
			return false;
		}

		const dpr = window.devicePixelRatio || 1;
		const rect = canvasRef.current.getBoundingClientRect();

		canvasRef.current.width = rect.width * dpr;
		canvasRef.current.height = rect.height * dpr;

		ctx.scale(dpr, dpr);
		contextRef.current = ctx;
		return true;
	}, []);

	// Renderizar el ruido
	const renderNoise = useCallback((time = 0) => {
		const ctx = contextRef.current;
		const canvas = canvasRef.current;

		if (!ctx || !canvas) {
			setError('Contexto o canvas no disponible');
			return;
		}

		try {
			// Tamaño optimizado del mapa de ruido
			const mapWidth = Math.ceil(canvas.width / 4);
			const mapHeight = Math.ceil(canvas.height / 4);

			// Semilla animada si está activado
			const animatedSeed = animated ? seed + time * animationSpeed * 0.001 : seed;

			// Generar o recuperar mapa de ruido
			const noiseMap = noiseCache.get(mapWidth, mapHeight, pattern as 'perlin' | 'simplex' | 'fractalNoise', {
				seed: animatedSeed,
				scale,
				octaves,
				persistence: density,
			});

			// Convertir a ImageData y renderizar
			const imageData = noiseMapToImageData(noiseMap, color, intensity);
			createImageBitmap(imageData)
				.then((bitmap) => {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.globalAlpha = opacity;
					ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
					ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, canvas.width, canvas.height);
					bitmap.close();

					if (animated) {
						animationRef.current = requestAnimationFrame(renderNoise);
					}
				})
				.catch((err) => {
					setError(`Error al crear bitmap: ${err.message}`);
				});
		} catch (err) {
			setError(`Error al generar ruido: ${err instanceof Error ? err.message : 'Error desconocido'}`);
		}
	}, [animated, animationSpeed, blendMode, color, density, intensity, opacity, pattern, scale, octaves, seed]);

	// Efecto principal de renderizado
	useEffect(() => {
		if (!shouldRender) return;

		const success = initializeCanvas();
		if (!success) return;

		if (animated) {
			animationRef.current = requestAnimationFrame(renderNoise);
		} else {
			renderNoise();
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [shouldRender, initializeCanvas, renderNoise, animated]);

	// Manejar redimensionamiento
	useEffect(() => {
		const handleResize = () => {
			const success = initializeCanvas();
			if (success) {
				renderNoise();
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [initializeCanvas, renderNoise]);

	if (!shouldRender) return null;
	if (error) {
		console.error('NoiseTextureLayer Error:', error);
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
					mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
				}}
			/>
		</motion.div>
	);
}
