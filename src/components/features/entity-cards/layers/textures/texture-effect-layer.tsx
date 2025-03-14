'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import type { BaseLayerConfig, LayerComponentProps } from '../layer-plugin-system';
import type { TextureConfig } from './texture-layer-schema';

/**
 * Componente principal para la capa de textura
 */
export function TextureEffectLayer({
	isExploded,
	isHovered,
	mousePosition,
	activeLayer,
	getExplodeLayerTransform,
	config,
	entityType,
	entityId,
}: LayerComponentProps<TextureConfig>) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isReady, setIsReady] = useState(false);
	const animationFrameRef = useRef<number | null>(null);

	// Si está configurado para mostrar solo en hover y no está en hover, no mostramos
	if (config.visibleOnHover && !isHovered) {
		return null;
	}

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		// Configurar el tamaño del canvas
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return;
		}

		let animationFrameId: number | null = null;

		// Función para renderizar la textura
		const renderTexture = () => {
			if (!ctx || !canvas) {
				return;
			}

			// Limpiar el canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Guardar el estado inicial
			ctx.save();

			// Aplicar rotación si es necesario
			if (config.rotation > 0) {
				ctx.translate(canvas.width / 2, canvas.height / 2);
				ctx.rotate((config.rotation * Math.PI) / 180);
				ctx.translate(-canvas.width / 2, -canvas.height / 2);
			}

			// Voltear horizontalmente o verticalmente si es necesario
			if (config.flipX || config.flipY) {
				ctx.translate(config.flipX ? canvas.width : 0, config.flipY ? canvas.height : 0);
				ctx.scale(config.flipX ? -1 : 1, config.flipY ? -1 : 1);
			}

			// Dibujar el patrón según el tipo
			const time = Date.now() * 0.001 * config.animationSpeed;

			switch (config.textureType) {
				case 'digital':
					drawDigitalPattern(ctx, canvas, time);
					break;
				case 'noise':
					drawNoisePattern(ctx, canvas);
					break;
				case 'dots':
					drawDotsPattern(ctx, canvas, time);
					break;
				case 'lines':
					drawLinesPattern(ctx, canvas, time);
					break;
				case 'grid':
					drawGridPattern(ctx, canvas);
					break;
				case 'diagonal':
					drawDiagonalPattern(ctx, canvas);
					break;
				case 'cross':
					drawCrossPattern(ctx, canvas);
					break;
				case 'hexagon':
					drawHexagonPattern(ctx, canvas);
					break;
				case 'diamond':
					drawDiamondPattern(ctx, canvas, time);
					break;
				case 'wave':
					drawWavePattern(ctx, canvas, time);
					break;
				case 'custom':
					if (config.customPattern) {
						drawCustomPattern(ctx, canvas, config.customPattern);
					}
					break;
			}

			// Restaurar el estado
			ctx.restore();

			// Continuar la animación si está habilitada
			if (config.animated) {
				animationFrameId = requestAnimationFrame(renderTexture);
				animationFrameRef.current = animationFrameId;
			}
		};

		// Función para dibujar patrón digital
		const drawDigitalPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
			ctx.fillStyle = config.color;
			const size = 10 * config.scale;
			const rows = Math.ceil(canvas.height / size);
			const cols = Math.ceil(canvas.width / size);

			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++) {
					const random = Math.random();
					if (random < config.density) {
						if (config.animated) {
							const val = Math.sin(i * j + time) * 0.5 + 0.5;
							ctx.globalAlpha = val * config.opacity;
						} else {
							ctx.globalAlpha = config.opacity;
						}
						ctx.fillRect(j * size, i * size, size - 1, size - 1);
					}
				}
			}
		};

		// Función para dibujar patrón de ruido
		const drawNoisePattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
			const imageData = ctx.createImageData(canvas.width, canvas.height);
			const data = imageData.data;

			for (let i = 0; i < data.length; i += 4) {
				const value = Math.random() < config.density ? 255 : 0;
				const alpha = value * config.opacity;

				// Aplicar color
				if (value > 0) {
					const color = hexToRgb(config.color);
					if (color) {
						data[i] = color.r;
						data[i + 1] = color.g;
						data[i + 2] = color.b;
						data[i + 3] = alpha;
					}
				} else {
					data[i] = 0;
					data[i + 1] = 0;
					data[i + 2] = 0;
					data[i + 3] = 0;
				}
			}

			ctx.putImageData(imageData, 0, 0);
		};

		// Función para dibujar patrón de puntos
		const drawDotsPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
			ctx.fillStyle = config.color;
			const size = 5 * config.scale;
			const spacing = 20 * config.scale;
			const rows = Math.ceil(canvas.height / spacing);
			const cols = Math.ceil(canvas.width / spacing);

			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++) {
					if (Math.random() < config.density) {
						ctx.globalAlpha = config.opacity;
						if (config.animated) {
							const offset = Math.sin(i + j + time) * 2;
							ctx.beginPath();
							ctx.arc(j * spacing + offset, i * spacing, size, 0, Math.PI * 2);
							ctx.fill();
						} else {
							ctx.beginPath();
							ctx.arc(j * spacing, i * spacing, size, 0, Math.PI * 2);
							ctx.fill();
						}
					}
				}
			}
		};

		// Función para dibujar patrón de líneas
		const drawLinesPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
			ctx.strokeStyle = config.color;
			ctx.lineWidth = 1 * config.scale;
			const spacing = 15 * config.scale;
			const lines = Math.ceil(canvas.height / spacing);

			ctx.globalAlpha = config.opacity;

			for (let i = 0; i < lines; i++) {
				const y = i * spacing;

				ctx.beginPath();
				if (config.animated) {
					const offset = Math.sin(i * 0.1 + time) * 5;
					ctx.moveTo(0, y + offset);

					for (let x = 0; x < canvas.width; x += 10) {
						const waveOffset = Math.sin(x * 0.01 + time) * 5;
						ctx.lineTo(x, y + offset + waveOffset);
					}
				} else {
					ctx.moveTo(0, y);
					ctx.lineTo(canvas.width, y);
				}

				ctx.stroke();
			}
		};

		// Función para dibujar patrón de cuadrícula
		const drawGridPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
			ctx.strokeStyle = config.color;
			ctx.lineWidth = 1;
			const size = 20 * config.scale;
			const rows = Math.ceil(canvas.height / size);
			const cols = Math.ceil(canvas.width / size);

			ctx.globalAlpha = config.opacity;

			// Líneas horizontales
			for (let i = 0; i <= rows; i++) {
				ctx.beginPath();
				ctx.moveTo(0, i * size);
				ctx.lineTo(canvas.width, i * size);
				ctx.stroke();
			}

			// Líneas verticales
			for (let j = 0; j <= cols; j++) {
				ctx.beginPath();
				ctx.moveTo(j * size, 0);
				ctx.lineTo(j * size, canvas.height);
				ctx.stroke();
			}
		};

		// Función para dibujar patrón diagonal
		const drawDiagonalPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
			ctx.strokeStyle = config.color;
			ctx.lineWidth = 1 * config.scale;
			const spacing = 20 * config.scale;
			const lines = Math.ceil((canvas.width + canvas.height) / spacing);

			ctx.globalAlpha = config.opacity;

			for (let i = -lines; i < lines; i++) {
				const offset = i * spacing;

				ctx.beginPath();
				ctx.moveTo(offset, 0);
				ctx.lineTo(offset + canvas.height, canvas.height);
				ctx.stroke();
			}
		};

		// Función para dibujar patrón de cruces
		const drawCrossPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
			ctx.strokeStyle = config.color;
			ctx.lineWidth = 1 * config.scale;
			const size = 10 * config.scale;
			const spacing = 30 * config.scale;
			const rows = Math.ceil(canvas.height / spacing);
			const cols = Math.ceil(canvas.width / spacing);

			ctx.globalAlpha = config.opacity;

			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++) {
					const x = j * spacing;
					const y = i * spacing;

					if (Math.random() < config.density) {
						// Línea horizontal
						ctx.beginPath();
						ctx.moveTo(x - size, y);
						ctx.lineTo(x + size, y);
						ctx.stroke();

						// Línea vertical
						ctx.beginPath();
						ctx.moveTo(x, y - size);
						ctx.lineTo(x, y + size);
						ctx.stroke();
					}
				}
			}
		};

		// Función para dibujar patrón de hexágonos
		const drawHexagonPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
			ctx.strokeStyle = config.color;
			ctx.lineWidth = 1 * config.scale;
			const size = 15 * config.scale;
			const horizontalSpacing = size * 1.5;
			const verticalSpacing = size * Math.sqrt(3);
			const rows = Math.ceil(canvas.height / verticalSpacing);
			const cols = Math.ceil(canvas.width / horizontalSpacing);

			ctx.globalAlpha = config.opacity;

			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++) {
					const offsetX = (i % 2) * (horizontalSpacing / 2);
					const x = j * horizontalSpacing + offsetX;
					const y = i * verticalSpacing;

					if (Math.random() < config.density) {
						drawHexagon(ctx, x, y, size);
					}
				}
			}
		};

		// Función auxiliar para dibujar un hexágono
		const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
			ctx.beginPath();
			for (let i = 0; i < 6; i++) {
				const angle = (Math.PI / 3) * i;
				const hx = x + size * Math.cos(angle);
				const hy = y + size * Math.sin(angle);
				if (i === 0) {
					ctx.moveTo(hx, hy);
				} else {
					ctx.lineTo(hx, hy);
				}
			}
			ctx.closePath();
			ctx.stroke();
		};

		// Función para dibujar patrón de diamantes
		const drawDiamondPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
			ctx.strokeStyle = config.color;
			ctx.lineWidth = 1 * config.scale;
			const size = 15 * config.scale;
			const spacing = 40 * config.scale;
			const rows = Math.ceil(canvas.height / spacing);
			const cols = Math.ceil(canvas.width / spacing);

			ctx.globalAlpha = config.opacity;

			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++) {
					let x = j * spacing;
					let y = i * spacing;

					if (config.animated) {
						const offset = Math.sin(i * j * 0.1 + time) * 5;
						x += offset;
						y += offset;
					}

					if (Math.random() < config.density) {
						ctx.beginPath();
						ctx.moveTo(x, y - size);
						ctx.lineTo(x + size, y);
						ctx.lineTo(x, y + size);
						ctx.lineTo(x - size, y);
						ctx.closePath();
						ctx.stroke();
					}
				}
			}
		};

		// Función para dibujar patrón de ondas
		const drawWavePattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
			ctx.strokeStyle = config.color;
			ctx.lineWidth = 2 * config.scale;
			const amplitude = 10 * config.scale;
			const frequency = 0.02 * config.scale;
			const ySpacing = 30 * config.scale;
			const lines = Math.ceil(canvas.height / ySpacing);

			ctx.globalAlpha = config.opacity;

			for (let i = 0; i < lines; i++) {
				const baseY = i * ySpacing;

				ctx.beginPath();
				ctx.moveTo(0, baseY);

				for (let x = 0; x < canvas.width; x++) {
					const y = baseY + Math.sin(x * frequency + (config.animated ? time : 0) + i * 0.5) * amplitude;
					ctx.lineTo(x, y);
				}

				ctx.stroke();
			}
		};

		// Función para dibujar patrón personalizado
		const drawCustomPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, svgData: string) => {
			const img = new Image();
			img.onload = () => {
				const pattern = ctx.createPattern(img, config.seamless ? 'repeat' : 'no-repeat');
				if (pattern) {
					ctx.fillStyle = pattern;
					ctx.globalAlpha = config.opacity;
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
			};
			img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
		};

		// Utilidad para convertir colores hex a RGB
		const hexToRgb = (hex: string) => {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result
				? {
						r: Number.parseInt(result[1], 16),
						g: Number.parseInt(result[2], 16),
						b: Number.parseInt(result[3], 16),
					}
				: null;
		};

		// Renderizar textura
		renderTexture();
		setIsReady(true);

		// Limpiar
		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, [
		config.textureType,
		config.color,
		config.opacity,
		config.scale,
		config.density,
		config.contrast,
		config.animated,
		config.animationSpeed,
		config.rotation,
		config.flipX,
		config.flipY,
		config.seamless,
		config.customPattern,
	]);

	return (
		<canvas
			ref={canvasRef}
			className={cn(
				'absolute inset-0 pointer-events-none z-20',
				isExploded ? 'exploded-layer' : '',
				!isReady && 'hidden'
			)}
			style={{
				mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
				...(isExploded ? getExplodeLayerTransform(2) : {}),
			}}
			data-layer-active={activeLayer === 'texture' || null}
			data-texture-type={config.textureType}
		/>
	);
}
