'use client';

import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayerComponentProps } from '../layer-plugin-system';
import type { PixelateConfig } from './pixelate-schema';

/**
 * Componente principal para la capa de pixelado
 */
export function PixelateEffectLayer({
	isExploded,
	isHovered,
	mousePosition,
	activeLayer,
	getExplodeLayerTransform,
	config,
	entityType,
	entityId,
}: LayerComponentProps<PixelateConfig>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
	const [isReady, setIsReady] = useState(false);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const animationFrameRef = useRef<number | null>(null);
	const initialRenderCompleteRef = useRef(false);

	// Si está configurado para mostrar solo en hover y no está en hover, no mostramos
	if (config.visibleOnHover && !isHovered) {
		return null;
	}

	// Envolvemos funciones en useCallback para evitar recreaciones en cada renderizado
	const captureContent = useCallback(() => {
		if (!canvasRef.current || !sourceCanvasRef.current) {
			return null;
		}

		const canvas = canvasRef.current;
		const content = sourceCanvasRef.current;
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return null;
		}

		// Ajustar tamaño del canvas
		canvas.width = content.offsetWidth * window.devicePixelRatio;
		canvas.height = content.offsetHeight * window.devicePixelRatio;

		// Capturar contenido como imagen
		html2canvas(content, {
			backgroundColor: null,
			scale: window.devicePixelRatio,
			logging: false,
			allowTaint: true,
			useCORS: true,
		}).then((contentCanvas) => {
			if (ctx && canvas) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(contentCanvas, 0, 0, canvas.width, canvas.height);
			}
		});

		// Creamos una imagen de datos temporal para devolver
		try {
			const tempCtx = canvas.getContext('2d');
			if (tempCtx) {
				const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
				return imageData;
			}
		} catch (err) {
			console.error('Error al capturar contenido:', err);
		}

		return null;
	}, [sourceCanvasRef, canvasRef]);

	// También envolvemos esta función en useCallback
	const applyPixelateEffect = useCallback((sourceImageData: ImageData, pixelSize: number, algorithm: string) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Crear un canvas temporal para el procesamiento
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;
		const tempCtx = tempCanvas.getContext('2d');
		if (!tempCtx) return;

		// Poner los datos de la imagen en el canvas temporal
		tempCtx.putImageData(sourceImageData, 0, 0);

		// Limpiar el canvas principal
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Aplicar el algoritmo correspondiente
		switch (algorithm) {
			case 'simple':
				applySimplePixelation(ctx, tempCanvas, pixelSize);
				break;
			case 'weighted':
				applyWeightedPixelation(ctx, tempCanvas, pixelSize);
				break;
			case 'adaptive':
				applyAdaptivePixelation(ctx, tempCanvas, pixelSize);
				break;
			case 'color-reduced':
				applyColorReducedPixelation(ctx, tempCanvas, pixelSize, 8);
				break;
			case 'mosaic':
				applyMosaicPixelation(ctx, tempCanvas, pixelSize, 'square');
				break;
			default:
				applySimplePixelation(ctx, tempCanvas, pixelSize);
		}

		// Si hay zonas de efecto, aplicarlas
		if (config.effectZone && config.effectZone !== 'full') {
			applyEffectZone(ctx, canvas.width, canvas.height);
		}
	}, [canvasRef, config.effectZone]);

	// Algoritmo de pixelado simple - promedia los colores en cada bloque
	const applySimplePixelation = (ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement, pixelSize: number) => {
		const { width, height } = sourceCanvas;

		for (let y = 0; y < height; y += pixelSize) {
			for (let x = 0; x < width; x += pixelSize) {
				// Tamaño del bloque actual (ajustado para el borde)
				const blockWidth = Math.min(pixelSize, width - x);
				const blockHeight = Math.min(pixelSize, height - y);

				// Obtener el color promedio del bloque
				const imageData = ctx.getImageData(x, y, blockWidth, blockHeight);
				const { r, g, b, a } = getAverageColor(imageData.data);

				// Dibujar el bloque pixelado
				ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
				ctx.fillRect(x, y, blockWidth, blockHeight);
			}
		}
	};

	// Algoritmo de pixelado ponderado - da más peso a los píxeles centrales
	const applyWeightedPixelation = (
		ctx: CanvasRenderingContext2D,
		sourceCanvas: HTMLCanvasElement,
		pixelSize: number
	) => {
		const { width, height } = sourceCanvas;
		const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
		if (!sourceCtx) {
			return;
		}

		for (let y = 0; y < height; y += pixelSize) {
			for (let x = 0; x < width; x += pixelSize) {
				// Tamaño del bloque actual (ajustado para el borde)
				const blockWidth = Math.min(pixelSize, width - x);
				const blockHeight = Math.min(pixelSize, height - y);

				// Obtener los datos del bloque
				const imageData = sourceCtx.getImageData(x, y, blockWidth, blockHeight);
				const { data } = imageData;

				// Calcular el centro del bloque
				const centerX = Math.floor(blockWidth / 2);
				const centerY = Math.floor(blockHeight / 2);

				// Si el bloque es demasiado pequeño, usar el algoritmo simple
				if (blockWidth <= 2 || blockHeight <= 2) {
					const { r, g, b, a } = getAverageColor(data);
					ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
					ctx.fillRect(x, y, blockWidth, blockHeight);
					continue;
				}

				// Obtener el color central
				const centerIndex = (centerY * blockWidth + centerX) * 4;
				const centerColor = {
					r: data[centerIndex],
					g: data[centerIndex + 1],
					b: data[centerIndex + 2],
					a: data[centerIndex + 3] / 255,
				};

				// Calcular color ponderado (50% centro, 50% promedio)
				const avgColor = getAverageColor(data);
				const finalColor = {
					r: Math.round(centerColor.r * 0.7 + avgColor.r * 0.3),
					g: Math.round(centerColor.g * 0.7 + avgColor.g * 0.3),
					b: Math.round(centerColor.b * 0.7 + avgColor.b * 0.3),
					a: centerColor.a * 0.7 + avgColor.a * 0.3,
				};

				// Dibujar el bloque pixelado
				ctx.fillStyle = `rgba(${finalColor.r}, ${finalColor.g}, ${finalColor.b}, ${finalColor.a})`;
				ctx.fillRect(x, y, blockWidth, blockHeight);
			}
		}
	};

	// Algoritmo de pixelado adaptativo - varía el tamaño según el contenido
	const applyAdaptivePixelation = (
		ctx: CanvasRenderingContext2D,
		sourceCanvas: HTMLCanvasElement,
		pixelSize: number
	) => {
		const { width, height } = sourceCanvas;
		const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
		if (!sourceCtx) {
			return;
		}

		// Analizar la imagen para determinar áreas de detalle
		const detailMap = createDetailMap(sourceCtx, width, height, pixelSize);

		// Aplicar pixelado con tamaños variables
		for (let y = 0; y < height; y += pixelSize) {
			for (let x = 0; x < width; x += pixelSize) {
				// Determinar el nivel de detalle en esta zona (0-1)
				const detail = getDetailLevel(detailMap, x, y, pixelSize, width, height);

				// Ajustar el tamaño del píxel según el detalle (más pequeño para más detalle)
				const adaptiveSize = Math.max(2, Math.round(pixelSize * (1 - detail * 0.7)));

				// Tamaño del bloque actual (ajustado para el borde)
				const blockWidth = Math.min(adaptiveSize, width - x);
				const blockHeight = Math.min(adaptiveSize, height - y);

				// Obtener el color promedio del bloque
				const imageData = sourceCtx.getImageData(x, y, blockWidth, blockHeight);
				const { r, g, b, a } = getAverageColor(imageData.data);

				// Dibujar el bloque pixelado
				ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
				ctx.fillRect(x, y, blockWidth, blockHeight);
			}
		}
	};

	// Algoritmo de pixelado con reducción de colores
	const applyColorReducedPixelation = (
		ctx: CanvasRenderingContext2D,
		sourceCanvas: HTMLCanvasElement,
		pixelSize: number,
		colorLevels: number
	) => {
		const { width, height } = sourceCanvas;
		const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
		if (!sourceCtx) {
			return;
		}

		// Si no hay reducción de color, usar el algoritmo simple
		if (!colorLevels || colorLevels >= 256) {
			applySimplePixelation(ctx, sourceCanvas, pixelSize);
			return;
		}

		// Número real de niveles a usar (entre 2 y 32)
		const levels = Math.max(2, Math.min(32, colorLevels));

		for (let y = 0; y < height; y += pixelSize) {
			for (let x = 0; x < width; x += pixelSize) {
				// Tamaño del bloque actual (ajustado para el borde)
				const blockWidth = Math.min(pixelSize, width - x);
				const blockHeight = Math.min(pixelSize, height - y);

				// Obtener el color promedio del bloque
				const imageData = sourceCtx.getImageData(x, y, blockWidth, blockHeight);
				const { r, g, b, a } = getAverageColor(imageData.data);

				// Aplicar reducción de colores
				const step = 255 / (levels - 1);
				const quantizedR = Math.round(Math.round(r / step) * step);
				const quantizedG = Math.round(Math.round(g / step) * step);
				const quantizedB = Math.round(Math.round(b / step) * step);

				// Dibujar el bloque pixelado con colores reducidos
				ctx.fillStyle = `rgba(${quantizedR}, ${quantizedG}, ${quantizedB}, ${a})`;
				ctx.fillRect(x, y, blockWidth, blockHeight);
			}
		}
	};

	// Algoritmo de pixelado con formas geométricas (mosaico)
	const applyMosaicPixelation = (
		ctx: CanvasRenderingContext2D,
		sourceCanvas: HTMLCanvasElement,
		pixelSize: number,
		shape: string
	) => {
		const { width, height } = sourceCanvas;
		const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
		if (!sourceCtx) {
			return;
		}

		for (let y = 0; y < height; y += pixelSize) {
			for (let x = 0; x < width; x += pixelSize) {
				// Tamaño del bloque actual (ajustado para el borde)
				const blockWidth = Math.min(pixelSize, width - x);
				const blockHeight = Math.min(pixelSize, height - y);

				// Obtener el color promedio del bloque
				const imageData = sourceCtx.getImageData(x, y, blockWidth, blockHeight);
				const { r, g, b, a } = getAverageColor(imageData.data);

				ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;

				// Dibujar la forma según la configuración
				switch (shape) {
					case 'circle':
						ctx.beginPath();
						ctx.arc(
							x + blockWidth / 2,
							y + blockHeight / 2,
							(Math.min(blockWidth, blockHeight) / 2) * 0.9,
							0,
							Math.PI * 2
						);
						ctx.fill();
						break;
					case 'diamond':
						ctx.beginPath();
						ctx.moveTo(x + blockWidth / 2, y);
						ctx.lineTo(x + blockWidth, y + blockHeight / 2);
						ctx.lineTo(x + blockWidth / 2, y + blockHeight);
						ctx.lineTo(x, y + blockHeight / 2);
						ctx.closePath();
						ctx.fill();
						break;
					case 'hexagon':
						drawHexagon(ctx, x + blockWidth / 2, y + blockHeight / 2, (Math.min(blockWidth, blockHeight) / 2) * 0.9);
						break;
					default:
						// Para cuadrados simplemente dibujamos un rectángulo
						ctx.fillRect(x, y, blockWidth, blockHeight);
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
		ctx.fill();
	};

	// Aplicar la zona de efecto (máscara radial)
	const applyEffectZone = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
		const { zone } = config;
		const x = zone.centerX * width;
		const y = zone.centerY * height;
		const radius = zone.radius * Math.max(width, height);
		const feather = zone.feather * radius;

		// Crear un canvas temporal para la máscara
		const maskCanvas = document.createElement('canvas');
		maskCanvas.width = width;
		maskCanvas.height = height;
		const maskCtx = maskCanvas.getContext('2d');
		if (!maskCtx) {
			return;
		}

		// Crear un gradiente radial para la máscara
		const gradient = maskCtx.createRadialGradient(x, y, radius - feather, x, y, radius);
		gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
		gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

		// Dibujar la máscara
		maskCtx.fillStyle = 'rgba(0, 0, 0, 0)';
		maskCtx.fillRect(0, 0, width, height);
		maskCtx.fillStyle = gradient;
		maskCtx.fillRect(0, 0, width, height);

		// Aplicar la máscara al canvas principal
		ctx.globalCompositeOperation = 'destination-in';
		ctx.drawImage(maskCanvas, 0, 0);
		ctx.globalCompositeOperation = 'source-over';
	};

	// Función para calcular el color promedio de un array de píxeles
	const getAverageColor = (data: Uint8ClampedArray) => {
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 0;
		let count = 0;

		for (let i = 0; i < data.length; i += 4) {
			// Solo considerar píxeles con suficiente opacidad
			if (data[i + 3] > 10) {
				r += data[i];
				g += data[i + 1];
				b += data[i + 2];
				a += data[i + 3];
				count++;
			}
		}

		// Evitar división por cero
		if (count === 0) {
			count = 1;
		}

		return {
			r: Math.round(r / count),
			g: Math.round(g / count),
			b: Math.round(b / count),
			a: a / count / 255,
		};
	};

	// Crear un mapa de niveles de detalle para pixelado adaptativo
	const createDetailMap = (ctx: CanvasRenderingContext2D, width: number, height: number, pixelSize: number) => {
		// Crear un mapa más pequeño para análisis rápido
		const mapWidth = Math.ceil(width / pixelSize);
		const mapHeight = Math.ceil(height / pixelSize);
		const detailMap = new Array(mapHeight).fill(0).map(() => new Array(mapWidth).fill(0));

		// Analizar la imagen para detectar bordes/detalles
		for (let y = 0; y < mapHeight; y++) {
			for (let x = 0; x < mapWidth; x++) {
				const blockX = x * pixelSize;
				const blockY = y * pixelSize;
				const blockWidth = Math.min(pixelSize, width - blockX);
				const blockHeight = Math.min(pixelSize, height - blockY);

				// No analizar bloques demasiado pequeños
				if (blockWidth < 2 || blockHeight < 2) {
					detailMap[y][x] = 0;
					continue;
				}

				// Obtener datos de este bloque
				const imageData = ctx.getImageData(blockX, blockY, blockWidth, blockHeight);
				const { data } = imageData;

				// Calcular la variación de color (más variación = más detalle)
				let variance = 0;
				const avgColor = getAverageColor(data);

				for (let i = 0; i < data.length; i += 4) {
					if (data[i + 3] < 10) {
						continue; // Ignorar píxeles transparentes
					}

					const pixelVariance =
						Math.abs(data[i] - avgColor.r) + Math.abs(data[i + 1] - avgColor.g) + Math.abs(data[i + 2] - avgColor.b);

					variance += pixelVariance;
				}

				// Normalizar y guardar el nivel de detalle (0-1)
				const normalizedVariance = Math.min(1, variance / (data.length / 4) / 255);
				detailMap[y][x] = normalizedVariance;
			}
		}

		return detailMap;
	};

	// Obtener el nivel de detalle de una posición en el mapa
	const getDetailLevel = (
		detailMap: number[][],
		x: number,
		y: number,
		pixelSize: number,
		_width: number,
		_height: number
	) => {
		const mapX = Math.floor(x / pixelSize);
		const mapY = Math.floor(y / pixelSize);

		// Asegurarse de que las coordenadas están dentro del mapa
		if (mapX < 0 || mapX >= detailMap[0].length || mapY < 0 || mapY >= detailMap.length) {
			return 0;
		}

		return detailMap[mapY][mapX];
	};

	// Efecto para realizar el pixelado cuando cambia cualquier propiedad relevante
	useEffect(() => {
		// Referencia al frame de animación para limpieza
		let animationFrame: number | null = null;

		// Función para procesar y aplicar el efecto
		const processEffect = () => {
			// Capturar el contenido como imagen
			const imageData = captureContent();
			if (!imageData) {
				return;
			}

			// Aplicar el efecto de pixelado
			applyPixelateEffect(imageData, config.pixelSize, config.algorithm);

			// Marcar como listo
			if (!isReady) {
				setIsReady(true);
			}

			// Animar si está habilitado
			if (config.animated) {
				animationFrame = requestAnimationFrame(processEffect);
				animationFrameRef.current = animationFrame;
			}
		};

		// Procesar por primera vez
		initialRenderCompleteRef.current = false;
		processEffect();
		initialRenderCompleteRef.current = true;

		// Limpiar al desmontar
		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	}, [
		config.pixelSize,
		config.algorithm,
		config.animated,
		captureContent,
		applyPixelateEffect,
		isReady
	]);

	return (
		<div
			ref={containerRef}
			className={cn('absolute inset-0 pointer-events-none z-25', isExploded ? 'exploded-layer' : '')}
			style={{
				mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
				...(isExploded ? getExplodeLayerTransform(4) : {}),
			}}
			data-layer-active={activeLayer === 'pixelate' || null}
		>
			{/* Canvas fuente (oculto) para capturar el contenido */}
			<canvas ref={sourceCanvasRef} className="hidden" width={dimensions.width || 1} height={dimensions.height || 1} />

			{/* Canvas de salida para mostrar el efecto */}
			<canvas
				ref={canvasRef}
				className={cn(
					'absolute inset-0',
					!isReady && 'opacity-0',
					isReady && 'opacity-100 transition-opacity duration-300'
				)}
				width={dimensions.width || 1}
				height={dimensions.height || 1}
				data-pixelate-algorithm={config.algorithm}
			/>
		</div>
	);
}
