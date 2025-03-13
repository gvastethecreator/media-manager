'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getEffectLayerIndex, sortEffectsByPriority } from '../config/layers-config';
import type { EffectsOptions } from '../types/card-settings-types';

interface DistortionEffectsProps {
	effects: EffectsOptions;
	className?: string;
}

export function DistortionEffects({ effects, className }: DistortionEffectsProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>();
	const lastTimeRef = useRef<number>(0);

	// Función principal de animación
	const animate = useCallback(
		(time: number) => {
			const canvas = canvasRef.current;
			if (!canvas) {
				return;
			}

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				return;
			}

			// Limpiar canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Aplicar efectos en orden
			sortEffectsByPriority(effects);

			// Función para aplicar efecto glitch
			const applyGlitchEffect = (ctx: CanvasRenderingContext2D, time: number) => {
				if (!effects.glitchEffect?.enabled) {
					return;
				}

				const { intensity, frequency, duration } = effects.glitchEffect;
				const glitchTime = time % duration;
				const glitchOffset = Math.sin(glitchTime * frequency) * intensity * 10;

				ctx.save();
				ctx.translate(glitchOffset, 0);
				ctx.drawImage(ctx.canvas, 0, 0);
				ctx.restore();
			};

			// Función para aplicar aberración cromática
			const applyChromaticAberration = (ctx: CanvasRenderingContext2D) => {
				if (!effects.chromaticAberration?.enabled) {
					return;
				}

				const { intensity, offset } = effects.chromaticAberration;
				const width = ctx.canvas.width;
				const height = ctx.canvas.height;

				const imageData = ctx.getImageData(0, 0, width, height);
				const data = imageData.data;

				for (let i = 0; i < data.length; i += 4) {
					const x = (i / 4) % width;
					const offsetX = Math.sin((x / width) * Math.PI) * offset * intensity * 5;

					// Desplazar canales RGB
					data[i] = data[i + Math.round(offsetX * 4)]; // R
					data[i + 1] = data[i + 1 + Math.round(offsetX * 4)]; // G
					data[i + 2] = data[i + 2 + Math.round(offsetX * 4)]; // B
				}

				ctx.putImageData(imageData, 0, 0);
			};

			// Función para aplicar pixelación
			const applyPixelate = (ctx: CanvasRenderingContext2D) => {
				if (!effects.pixelate?.enabled) {
					return;
				}

				const { intensity, blockSize } = effects.pixelate;
				const width = ctx.canvas.width;
				const height = ctx.canvas.height;
				const blockWidth = Math.max(1, Math.round(blockSize * (1 - intensity)));
				const blockHeight = blockWidth;

				const imageData = ctx.getImageData(0, 0, width, height);
				const data = imageData.data;

				for (let y = 0; y < height; y += blockHeight) {
					for (let x = 0; x < width; x += blockWidth) {
						let r = 0;
						let g = 0;
						let b = 0;
						let a = 0;
						let count = 0;

						// Calcular promedio de color en el bloque
						for (let by = 0; by < blockHeight && y + by < height; by++) {
							for (let bx = 0; bx < blockWidth && x + bx < width; bx++) {
								const i = ((y + by) * width + (x + bx)) * 4;
								r += data[i];
								g += data[i + 1];
								b += data[i + 2];
								a += data[i + 3];
								count++;
							}
						}

						// Aplicar color promedio al bloque
						r = Math.round(r / count);
						g = Math.round(g / count);
						b = Math.round(b / count);
						a = Math.round(a / count);

						for (let by = 0; by < blockHeight && y + by < height; by++) {
							for (let bx = 0; bx < blockWidth && x + bx < width; bx++) {
								const i = ((y + by) * width + (x + bx)) * 4;
								data[i] = r;
								data[i + 1] = g;
								data[i + 2] = b;
								data[i + 3] = a;
							}
						}
					}
				}

				ctx.putImageData(imageData, 0, 0);
			};

			// Aplicar glitch
			applyGlitchEffect(ctx, time - lastTimeRef.current);

			// Aplicar aberración cromática
			applyChromaticAberration(ctx);

			// Aplicar pixelación
			applyPixelate(ctx);

			lastTimeRef.current = time;
			animationFrameRef.current = requestAnimationFrame(animate);
		},
		[effects]
	);

	// Inicializar canvas y comenzar animación
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		// Ajustar tamaño del canvas
		const resizeCanvas = () => {
			const rect = canvas.parentElement?.getBoundingClientRect();
			if (rect) {
				canvas.width = rect.width;
				canvas.height = rect.height;
			}
		};

		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// Comenzar animación
		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [animate]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: getEffectLayerIndex('glitchEffect'),
			}}
		/>
	);
}
