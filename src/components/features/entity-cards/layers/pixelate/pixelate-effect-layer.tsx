'use client';

import { cn } from '@/lib/utils';
import domtoimage from 'dom-to-image-more';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayerComponentProps } from '../layer-plugin-system';
import type { PixelateConfig } from './pixelate-schema';

// Tipo MixBlendMode para solucionar el error de tipado
type MixBlendMode =
	| 'normal' | 'multiply' | 'screen' | 'overlay'
	| 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
	| 'hard-light' | 'soft-light' | 'difference' | 'exclusion'
	| 'hue' | 'saturation' | 'color' | 'luminosity';

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
	const sourceCanvasRef = useRef<HTMLDivElement>(null);
	const [isReady, setIsReady] = useState(false);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const animationFrameRef = useRef<number | null>(null);
	const initialRenderCompleteRef = useRef(false);
	const imageRef = useRef<HTMLImageElement | null>(null);

	// Efecto para actualizar las dimensiones cuando el contenedor cambia de tamaño
	useEffect(() => {
		if (!containerRef.current) return;

		// Función para actualizar las dimensiones
		const updateDimensions = () => {
			if (containerRef.current) {
				const { offsetWidth, offsetHeight } = containerRef.current;
				// Asegurarse de que las dimensiones nunca sean cero
				setDimensions({
					width: Math.max(1, offsetWidth * window.devicePixelRatio),
					height: Math.max(1, offsetHeight * window.devicePixelRatio)
				});
			}
		};

		// Actualizar dimensiones inicialmente
		updateDimensions();

		// Observar cambios de tamaño en el contenedor
		const resizeObserver = new ResizeObserver(updateDimensions);
		resizeObserver.observe(containerRef.current);

		return () => {
			if (containerRef.current) {
				resizeObserver.unobserve(containerRef.current);
			}
			resizeObserver.disconnect();
		};
	}, []);

	// Si está configurado para mostrar solo en hover y no está en hover, no mostramos
	if (config.visibleOnHover && !isHovered) {
		return null;
	}

	// Funciones auxiliares para algoritmos de pixelado
	// Función para calcular el color promedio
	const getAverageColor = useCallback((data: Uint8ClampedArray) => {
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 0;
		let count = 0;

		for (let i = 0; i < data.length; i += 4) {
			const alpha = data[i + 3] / 255;
			if (alpha > 0) { // Solo contar píxeles visibles
				r += data[i] * alpha;
				g += data[i + 1] * alpha;
				b += data[i + 2] * alpha;
				a += data[i + 3];
				count++;
			}
		}

		if (count === 0) return { r: 0, g: 0, b: 0, a: 0 };

		return {
			r: Math.round(r / count),
			g: Math.round(g / count),
			b: Math.round(b / count),
			a: a / (count * 255) // Normalizar alfa entre 0 y 1
		};
	}, []);

	// Función para calcular color promedio ponderado
	const getWeightedAverageColor = useCallback((data: Uint8ClampedArray, width: number, height: number) => {
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 0;
		let totalWeight = 0;
		const pixelCount = width * height;

		for (let i = 0; i < data.length; i += 4) {
			const pixelIndex = i / 4;
			const x = pixelIndex % width;
			const y = Math.floor(pixelIndex / width);

			// Ponderación según distancia al centro
			const distToCenter = Math.sqrt(
				((x - width / 2) / width) ** 2 +
				((y - height / 2) / height) ** 2
			);
			const weight = 1 - distToCenter; // Mayor peso para píxeles centrales

			r += data[i] * weight;
			g += data[i + 1] * weight;
			b += data[i + 2] * weight;
			a += data[i + 3] * weight;
			totalWeight += weight;
		}

		if (totalWeight === 0) return { r: 0, g: 0, b: 0, a: 0 };

		return {
			r: Math.round(r / totalWeight),
			g: Math.round(g / totalWeight),
			b: Math.round(b / totalWeight),
			a: Math.min(1, a / (totalWeight * 255)) // Normalizar alfa entre 0 y 1
		};
	}, []);

	// Detección de bordes básica para algoritmo adaptativo
	const applyEdgeDetection = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
		const imageData = ctx.getImageData(0, 0, width, height);
		const data = imageData.data;
		const edgeData = new Uint8ClampedArray(data.length / 4);

		// Aplicar operador Sobel para detección de bordes
		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				const idx = (y * width + x) * 4;

				// Calcular gradientes usando operador Sobel simplificado
				const gx =
					data[idx - 4 - width * 4] +
					2 * data[idx - 4] +
					data[idx - 4 + width * 4] -
					data[idx + 4 - width * 4] -
					2 * data[idx + 4] -
					data[idx + 4 + width * 4];

				const gy =
					data[idx - width * 4 - 4] +
					2 * data[idx - width * 4] +
					data[idx - width * 4 + 4] -
					data[idx + width * 4 - 4] -
					2 * data[idx + width * 4] -
					data[idx + width * 4 + 4];

				// Magnitud del gradiente
				const g = Math.sqrt(gx * gx + gy * gy);

				// Normalizar y almacenar
				edgeData[y * width + x] = Math.min(255, g) / 255;
			}
		}

		return edgeData;
	}, []);

	// Calcular nivel de detalle en un área para pixelado adaptativo
	const getAreaDetail = useCallback((
		edgeData: Uint8ClampedArray,
		x: number,
		y: number,
		size: number,
		width: number,
		height: number
	) => {
		let totalEdgeValue = 0;
		let count = 0;

		// Calcular el detalle promedio en el área
		const endY = Math.min(y + size, height);
		const endX = Math.min(x + size, width);

		for (let cy = y; cy < endY; cy++) {
			for (let cx = x; cx < endX; cx++) {
				if (cx >= 0 && cy >= 0 && cx < width && cy < height) {
					totalEdgeValue += edgeData[cy * width + cx];
					count++;
				}
			}
		}

		return count > 0 ? totalEdgeValue / count : 0;
	}, []);

	// Algoritmo de pixelado simple - promedia los colores en cada bloque
	const applySimplePixelation = useCallback((ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement, pixelSize: number) => {
		const { width, height } = sourceCanvas;
		const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
		if (!sourceCtx) return;

		for (let y = 0; y < height; y += pixelSize) {
			for (let x = 0; x < width; x += pixelSize) {
				// Tamaño del bloque actual (ajustado para el borde)
				const blockWidth = Math.min(pixelSize, width - x);
				const blockHeight = Math.min(pixelSize, height - y);

				// Obtener el color promedio del bloque
				const imageData = sourceCtx.getImageData(x, y, blockWidth, blockHeight);
				const { r, g, b, a } = getAverageColor(imageData.data);

				// Dibujar el bloque pixelado
				ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
				ctx.fillRect(x, y, blockWidth, blockHeight);
			}
		}
	}, [getAverageColor]);

	// Algoritmo de pixelado ponderado - da más peso a los píxeles centrales
	const applyWeightedPixelation = useCallback(
		(ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement, pixelSize: number) => {
			const { width, height } = sourceCanvas;
			const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
			if (!sourceCtx) {
				return;
			}

			// Implementación del algoritmo de pixelado ponderado
			for (let y = 0; y < height; y += pixelSize) {
				for (let x = 0; x < width; x += pixelSize) {
					// Tamaño del bloque actual (ajustado para el borde)
					const blockWidth = Math.min(pixelSize, width - x);
					const blockHeight = Math.min(pixelSize, height - y);

					try {
						// Obtener los datos de imagen del bloque
						const imageData = sourceCtx.getImageData(x, y, blockWidth, blockHeight);

						// Aplicar ponderación - más peso al centro
						const { r, g, b, a } = getWeightedAverageColor(imageData.data, blockWidth, blockHeight);

						// Dibujar el bloque pixelado
						ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
						ctx.fillRect(x, y, blockWidth, blockHeight);
					} catch (err) {
						console.error('Error en pixelado ponderado:', err);
						// Fallback en caso de error
						ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
						ctx.fillRect(x, y, blockWidth, blockHeight);
					}
				}
			}
		},
		[getWeightedAverageColor]
	);

	// Algoritmo adaptativo - tamaño de píxel variable según detalles
	const applyAdaptivePixelation = useCallback(
		(ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement, basePixelSize: number) => {
			const { width, height } = sourceCanvas;
			const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
			if (!sourceCtx) {
				return;
			}

			// Detectar bordes y áreas de detalle
			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = width;
			tempCanvas.height = height;
			const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
			if (!tempCtx) return;

			// Copiar imagen original al canvas temporal
			tempCtx.drawImage(sourceCanvas, 0, 0);

			// Aplicar detección de bordes básica
			const edgeData = applyEdgeDetection(tempCtx, width, height);

			// Dibujar con tamaño de píxel adaptativo
			for (let y = 0; y < height; y += basePixelSize) {
				for (let x = 0; x < width; x += basePixelSize) {
					// Determinar si esta área tiene mucho detalle
					const areaDetail = getAreaDetail(edgeData, x, y, basePixelSize, width, height);

					// Ajustar tamaño de píxel según detalle
					// (áreas con más detalle tienen píxeles más pequeños)
					const adjustedSize = Math.max(
						basePixelSize / 2,
						basePixelSize * (1 - areaDetail * 0.7)
					);

					// Tamaño del bloque actual (ajustado para el borde)
					const blockWidth = Math.min(adjustedSize, width - x);
					const blockHeight = Math.min(adjustedSize, height - y);

					// Obtener color promedio
					const imageData = sourceCtx.getImageData(x, y, blockWidth, blockHeight);
					const { r, g, b, a } = getAverageColor(imageData.data);

					// Dibujar el bloque pixelado
					ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
					ctx.fillRect(x, y, blockWidth, blockHeight);
				}
			}
		},
		[applyEdgeDetection, getAreaDetail, getAverageColor]
	);

	// Reduce la paleta de colores para un efecto de pixelado tipo retro
	const applyColorReducedPixelation = useCallback(
		(ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement, pixelSize: number, colorBits = 8) => {
			const { width, height } = sourceCanvas;
			const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
			if (!sourceCtx) {
				return;
			}

			// Factor de cuantización para reducir colores
			const quantizationFactor = 255 / (2 ** colorBits - 1);

			for (let y = 0; y < height; y += pixelSize) {
				for (let x = 0; x < width; x += pixelSize) {
					// Tamaño del bloque actual (ajustado para el borde)
					const blockWidth = Math.min(pixelSize, width - x);
					const blockHeight = Math.min(pixelSize, height - y);

					// Obtener el color promedio del bloque
					const imageData = sourceCtx.getImageData(x, y, blockWidth, blockHeight);
					let { r, g, b, a } = getAverageColor(imageData.data);

					// Reducir la profundidad de color
					r = Math.round(Math.round(r / quantizationFactor) * quantizationFactor);
					g = Math.round(Math.round(g / quantizationFactor) * quantizationFactor);
					b = Math.round(Math.round(b / quantizationFactor) * quantizationFactor);

					// Dibujar el bloque pixelado
					ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
					ctx.fillRect(x, y, blockWidth, blockHeight);
				}
			}
		},
		[getAverageColor]
	);

	// Efecto de mosaico - píxeles con formas especiales
	const applyMosaicPixelation = useCallback(
		(ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement, pixelSize: number, shape = 'square') => {
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

					// Dibujar el píxel según la forma especificada
					switch (shape) {
						case 'circle':
							ctx.beginPath();
							ctx.arc(
								x + blockWidth / 2,
								y + blockHeight / 2,
								Math.min(blockWidth, blockHeight) / 2,
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
						case 'triangle':
							ctx.beginPath();
							ctx.moveTo(x + blockWidth / 2, y);
							ctx.lineTo(x + blockWidth, y + blockHeight);
							ctx.lineTo(x, y + blockHeight);
							ctx.closePath();
							ctx.fill();
							break;
						default:
							ctx.fillRect(x, y, blockWidth, blockHeight);
					}
				}
			}
		},
		[getAverageColor]
	);

	// Función para aplicar zona de efecto
	const applyEffectZone = useCallback(
		(ctx: CanvasRenderingContext2D, width: number, height: number) => {
			if (config.zone?.enabled) {
				// Gradiente radial desde el centro
				const x = config.zone.centerX * width;
				const y = config.zone.centerY * height;
				const radius = config.zone.radius * Math.min(width, height);
				const feather = config.zone.feather * radius;

				const gradient = ctx.createRadialGradient(
					x, y, radius - feather,
					x, y, radius
				);
				gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); // Centro opaco
				gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Borde transparente

				// Crear máscara con gradiente
				ctx.globalCompositeOperation = 'destination-in';
				ctx.fillStyle = gradient;
				ctx.fillRect(0, 0, width, height);

				// Restaurar modo de composición
				ctx.globalCompositeOperation = 'source-over';
			}
		},
		[config.zone]
	);

	// Aplicar efecto de pixelado
	const applyPixelateEffect = useCallback(
		(sourceImageData: ImageData, pixelSize: number, algorithm: string) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext('2d', { willReadFrequently: true });
			if (!ctx) return;

			// Crear un canvas temporal para el procesamiento
			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = canvas.width;
			tempCanvas.height = canvas.height;
			const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
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
				case 'color':
					applyColorReducedPixelation(ctx, tempCanvas, pixelSize, config.colorReduction || 8);
					break;
				case 'mosaic':
					applyMosaicPixelation(ctx, tempCanvas, pixelSize, config.shape || 'square');
					break;
				default:
					applySimplePixelation(ctx, tempCanvas, pixelSize);
			}

			// Si hay zonas de efecto, aplicarlas
			if (config.zone?.enabled) {
				applyEffectZone(ctx, canvas.width, canvas.height);
			}

			// Marcar como listo después de aplicar el efecto
			if (!isReady) {
				setIsReady(true);
			}
		},
		[
			config.zone,
			config.colorReduction,
			config.shape,
			isReady,
			applySimplePixelation,
			applyWeightedPixelation,
			applyAdaptivePixelation,
			applyColorReducedPixelation,
			applyMosaicPixelation,
			applyEffectZone
		]
	);

	// Envolvemos funciones en useCallback para evitar recreaciones en cada renderizado
	const captureContent = useCallback(() => {
		if (!canvasRef.current || !sourceCanvasRef.current) {
			return null;
		}

		const canvas = canvasRef.current;
		const content = sourceCanvasRef.current;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });

		if (!ctx) {
			return null;
		}

		// Ajustar tamaño del canvas
		canvas.width = Math.max(1, content.offsetWidth * window.devicePixelRatio);
		canvas.height = Math.max(1, content.offsetHeight * window.devicePixelRatio);

		// Usar dom-to-image-more en lugar de html2canvas
		domtoimage.toCanvas(content, {
			width: canvas.width,
			height: canvas.height,
			scale: window.devicePixelRatio,
			bgcolor: undefined,
			imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
			filter: (node) => {
				// Mejorar el filtro para ignorar elementos que no queremos capturar
				if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') {
					return false;
				}
				return true;
			}
		})
			.then((contentCanvas) => {
				if (ctx && canvas) {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(contentCanvas, 0, 0, canvas.width, canvas.height);

					// Almacenar los datos de imagen después de dibujar
					try {
						// Verificar que las dimensiones son válidas antes de obtener datos de imagen
						if (canvas.width > 0 && canvas.height > 0) {
							const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
							// Aplicar el efecto de pixelado inmediatamente
							applyPixelateEffect(imageData, config.pixelSize || 8, config.algorithm || 'simple');
						}
					} catch (err) {
						console.error('Error al obtener datos de imagen:', err);
					}
				}
			})
			.catch(err => {
				console.error('Error al renderizar con dom-to-image-more:', err);

				// Crear un fallback simple si dom-to-image-more falla
				if (ctx && canvas && canvas.width > 0 && canvas.height > 0) {
					ctx.fillStyle = '#333333';
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.fillStyle = '#666666';

					// Dibujar un patrón simple de pixelado como fallback
					const pixelSize = config.pixelSize || 10;
					for (let y = 0; y < canvas.height; y += pixelSize) {
						for (let x = 0; x < canvas.width; x += pixelSize) {
							if ((x + y) % (pixelSize * 2) === 0) {
								ctx.fillRect(x, y, pixelSize, pixelSize);
							}
						}
					}

					// Marcar como listo incluso con fallback
					if (!isReady) {
						setIsReady(true);
					}
				}
			});

		// Creamos una imagen de datos temporal para devolver
		try {
			const tempCtx = canvas.getContext('2d', { willReadFrequently: true });
			if (tempCtx) {
				// Verificar que las dimensiones son válidas antes de obtener datos de imagen
				if (canvas.width > 0 && canvas.height > 0) {
					const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
					return imageData;
				}
				console.warn('Dimensiones de canvas inválidas:', { width: canvas.width, height: canvas.height });
			}
		} catch (err) {
			console.error('Error al capturar contenido:', err);
		}

		return null;
	}, [config.algorithm, config.pixelSize, isReady, applyPixelateEffect]);

	// Efecto para renderizado inicial
	useEffect(() => {
		if (!initialRenderCompleteRef.current && canvasRef.current && sourceCanvasRef.current) {
			// Hacer la captura inicial
			captureContent();
			initialRenderCompleteRef.current = true;
		}
	}, [captureContent]);

	// Efecto para actualizar el canvas cuando cambia el DOM
	useEffect(() => {
		// Solo actualizar si la configuración es diferente a la actual
		if (isReady) {
			// Capturar el contenido después de un breve retraso
			// Esto es útil cuando hay cambios en el DOM que necesitan tiempo para renderizarse
			const timeoutId = setTimeout(() => {
				captureContent();
			}, 100);

			return () => clearTimeout(timeoutId);
		}
	}, [captureContent, isReady]);

	// Renderizar el componente
	return (
		<div
			ref={containerRef}
			className={cn(
				'absolute inset-0 overflow-hidden',
				isExploded ? 'exploded-layer' : ''
			)}
			style={{
				...getExplodeLayerTransform(config.layerIndex || 0),
				pointerEvents: 'none',
				opacity: isReady ? config.opacity || 0.75 : 0,
				transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-out',
			}}
		>
			{/* Contenedor fuente para capturar (invisible) */}
			<div
				ref={sourceCanvasRef}
				className="absolute inset-0 opacity-0 pointer-events-none"
				aria-hidden="true"
			>
				{/* Se captura el contenido del elemento padre - dejamos vacío intencionalmente */}
			</div>

			{/* Canvas donde dibujamos el efecto pixelado */}
			<canvas
				ref={canvasRef}
				className={cn(
					'absolute inset-0 w-full h-full',
					config.visibleOnHover ? 'transition-opacity duration-300' : ''
				)}
				width={dimensions.width}
				height={dimensions.height}
				style={{
					opacity: config.opacity ?? 0.75,
					mixBlendMode: (config.blendMode || 'normal') as MixBlendMode,
				}}
			/>
		</div>
	);
}
