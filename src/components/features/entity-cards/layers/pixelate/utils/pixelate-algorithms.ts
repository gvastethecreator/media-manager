/**
 * Utilidades y algoritmos para pixelado de imágenes
 */

/**
 * Opciones para los algoritmos de pixelado
 */
export interface PixelateOptions {
	// Tamaño de los píxeles
	pixelSize: number;

	// Tipo de algoritmo
	algorithm: 'simple' | 'weighted' | 'adaptive';

	// Configuración para pixelado por zonas
	applyToSpot?: boolean;
	spotRadius?: number;
	spotPosition?: { x: number; y: number };

	// Configuración para reducción de colores
	colorReduction?: boolean;
	colorLevels?: number;
}

/**
 * Algoritmo básico de pixelado que toma el promedio simple de los píxeles
 * en el área especificada
 */
export function pixelateSimple(
	inputData: ImageData,
	pixelSize: number,
	_options: Partial<PixelateOptions> = {}
): ImageData {
	const { width, height, data } = inputData;
	const outputData = new Uint8ClampedArray(data.length);

	// Normalizar tamaño de píxel
	const pxSize = Math.max(1, Math.floor(pixelSize));

	// Iterar por bloques de píxeles
	for (let y = 0; y < height; y += pxSize) {
		for (let x = 0; x < width; x += pxSize) {
			// Calcular el promedio de los píxeles en el bloque
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			let count = 0;

			// Calcular el área a promediar
			const blockWidth = Math.min(pxSize, width - x);
			const blockHeight = Math.min(pxSize, height - y);

			// Sumar los valores de color para cada píxel en el bloque
			for (let dy = 0; dy < blockHeight; dy++) {
				for (let dx = 0; dx < blockWidth; dx++) {
					const index = ((y + dy) * width + (x + dx)) * 4;

					r += data[index];
					g += data[index + 1];
					b += data[index + 2];
					a += data[index + 3];

					count++;
				}
			}

			// Calcular el promedio
			if (count > 0) {
				r = Math.round(r / count);
				g = Math.round(g / count);
				b = Math.round(b / count);
				a = Math.round(a / count);
			}

			// Aplicar el color promedio a todos los píxeles del bloque
			for (let dy = 0; dy < blockHeight; dy++) {
				for (let dx = 0; dx < blockWidth; dx++) {
					const index = ((y + dy) * width + (x + dx)) * 4;

					outputData[index] = r;
					outputData[index + 1] = g;
					outputData[index + 2] = b;
					outputData[index + 3] = a;
				}
			}
		}
	}

	return new ImageData(outputData, width, height);
}

/**
 * Algoritmo de pixelado ponderado que da más peso a los píxeles cercanos al centro
 * para preservar más detalles importantes
 */
export function pixelateWeighted(
	inputData: ImageData,
	pixelSize: number,
	_options: Partial<PixelateOptions> = {}
): ImageData {
	const { width, height, data } = inputData;
	const outputData = new Uint8ClampedArray(data.length);

	// Normalizar tamaño de píxel
	const pxSize = Math.max(1, Math.floor(pixelSize));

	// Función para calcular el peso según la distancia al centro
	const calculateWeight = (dx: number, dy: number, blockWidth: number, blockHeight: number): number => {
		// Coordenadas normalizadas (-1 a 1) desde el centro
		const nx = (dx / blockWidth) * 2 - 1;
		const ny = (dy / blockHeight) * 2 - 1;

		// Distancia al centro (0 a 1, donde 0 es el centro)
		const distance = Math.sqrt(nx * nx + ny * ny);

		// Peso inverso a la distancia (mayor peso en el centro)
		return 1 - Math.min(1, distance);
	};

	// Iterar por bloques de píxeles
	for (let y = 0; y < height; y += pxSize) {
		for (let x = 0; x < width; x += pxSize) {
			// Variables para cálculo ponderado
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			let totalWeight = 0;

			// Calcular el área a promediar
			const blockWidth = Math.min(pxSize, width - x);
			const blockHeight = Math.min(pxSize, height - y);

			// Sumar los valores ponderados para cada píxel en el bloque
			for (let dy = 0; dy < blockHeight; dy++) {
				for (let dx = 0; dx < blockWidth; dx++) {
					const index = ((y + dy) * width + (x + dx)) * 4;
					const weight = calculateWeight(dx, dy, blockWidth, blockHeight);

					r += data[index] * weight;
					g += data[index + 1] * weight;
					b += data[index + 2] * weight;
					a += data[index + 3] * weight;

					totalWeight += weight;
				}
			}

			// Calcular el promedio ponderado
			if (totalWeight > 0) {
				r = Math.round(r / totalWeight);
				g = Math.round(g / totalWeight);
				b = Math.round(b / totalWeight);
				a = Math.round(a / totalWeight);
			}

			// Aplicar el color promedio a todos los píxeles del bloque
			for (let dy = 0; dy < blockHeight; dy++) {
				for (let dx = 0; dx < blockWidth; dx++) {
					const index = ((y + dy) * width + (x + dx)) * 4;

					outputData[index] = r;
					outputData[index + 1] = g;
					outputData[index + 2] = b;
					outputData[index + 3] = a;
				}
			}
		}
	}

	return new ImageData(outputData, width, height);
}

/**
 * Algoritmo de pixelado adaptativo que ajusta el tamaño de los píxeles
 * según el detalle de la imagen (usa píxeles más pequeños en áreas con más detalle)
 */
export function pixelateAdaptive(
	inputData: ImageData,
	pixelSize: number,
	_options: Partial<PixelateOptions> = {}
): ImageData {
	const { width, height, data } = inputData;
	const outputData = new Uint8ClampedArray(data.length);

	// Normalizar tamaño de píxel
	const pxSize = Math.max(1, Math.floor(pixelSize));

	// Primero, calculamos un mapa de detalles (variación del color en cada área)
	const detailMap = new Float32Array(Math.ceil(width / pxSize) * Math.ceil(height / pxSize));

	// Calcular la variación de color en cada bloque
	for (let y = 0; y < height; y += pxSize) {
		for (let x = 0; x < width; x += pxSize) {
			const blockWidth = Math.min(pxSize, width - x);
			const blockHeight = Math.min(pxSize, height - y);

			// Calcular valores mínimos y máximos para cada canal
			let rMin = 255;
			let rMax = 0;
			let gMin = 255;
			let gMax = 0;
			let bMin = 255;
			let bMax = 0;

			for (let dy = 0; dy < blockHeight; dy++) {
				for (let dx = 0; dx < blockWidth; dx++) {
					const index = ((y + dy) * width + (x + dx)) * 4;

					rMin = Math.min(rMin, data[index]);
					rMax = Math.max(rMax, data[index]);

					gMin = Math.min(gMin, data[index + 1]);
					gMax = Math.max(gMax, data[index + 1]);

					bMin = Math.min(bMin, data[index + 2]);
					bMax = Math.max(bMax, data[index + 2]);
				}
			}

			// Variación total de color (suma de rangos de cada canal)
			const variation = rMax - rMin + (gMax - gMin) + (bMax - bMin);

			// Guardar en el mapa de detalles
			const blockIndex = Math.floor(y / pxSize) * Math.ceil(width / pxSize) + Math.floor(x / pxSize);
			detailMap[blockIndex] = variation;
		}
	}

	// Normalizar el mapa de detalles
	let maxVariation = 0;
	for (let i = 0; i < detailMap.length; i++) {
		maxVariation = Math.max(maxVariation, detailMap[i]);
	}

	if (maxVariation > 0) {
		for (let i = 0; i < detailMap.length; i++) {
			detailMap[i] /= maxVariation;
		}
	}

	// Copiar primero los datos originales
	outputData.set(data);

	// Ahora aplicamos pixelado con tamaño variable según el mapa de detalles
	for (let y = 0; y < height; y += pxSize) {
		for (let x = 0; x < width; x += pxSize) {
			// Obtener nivel de detalle para este bloque
			const blockIndex = Math.floor(y / pxSize) * Math.ceil(width / pxSize) + Math.floor(x / pxSize);
			const detailLevel = detailMap[blockIndex];

			// Calcular tamaño de píxel adaptativo (menor tamaño para áreas con más detalle)
			const adaptiveSize = Math.max(1, Math.round(pxSize * (1 - detailLevel * 0.75)));

			// Si el tamaño adaptativo es igual al tamaño máximo, aplicar pixelado simple
			if (adaptiveSize >= pxSize) {
				applyPixelToBlock(data, outputData, x, y, pxSize, width, height);
			} else {
				// Aplicar pixelado con tamaño adaptativo
				for (let subY = y; subY < y + pxSize && subY < height; subY += adaptiveSize) {
					for (let subX = x; subX < x + pxSize && subX < width; subX += adaptiveSize) {
						applyPixelToBlock(data, outputData, subX, subY, adaptiveSize, width, height);
					}
				}
			}
		}
	}

	return new ImageData(outputData, width, height);
}

/**
 * Función auxiliar para aplicar pixelado a un bloque específico
 */
function applyPixelToBlock(
	inputData: Uint8ClampedArray,
	outputData: Uint8ClampedArray,
	x: number,
	y: number,
	size: number,
	width: number,
	height: number
): void {
	// Calcular el tamaño real del bloque (puede ser menor en los bordes)
	const blockWidth = Math.min(size, width - x);
	const blockHeight = Math.min(size, height - y);

	// Calcular el color promedio del bloque
	let r = 0;
	let g = 0;
	let b = 0;
	let a = 0;
	let count = 0;

	for (let dy = 0; dy < blockHeight; dy++) {
		for (let dx = 0; dx < blockWidth; dx++) {
			const index = ((y + dy) * width + (x + dx)) * 4;

			r += inputData[index];
			g += inputData[index + 1];
			b += inputData[index + 2];
			a += inputData[index + 3];

			count++;
		}
	}

	// Calcular el promedio
	if (count > 0) {
		r = Math.round(r / count);
		g = Math.round(g / count);
		b = Math.round(b / count);
		a = Math.round(a / count);
	}

	// Aplicar el color promedio a todos los píxeles del bloque
	for (let dy = 0; dy < blockHeight; dy++) {
		for (let dx = 0; dx < blockWidth; dx++) {
			const index = ((y + dy) * width + (x + dx)) * 4;

			outputData[index] = r;
			outputData[index + 1] = g;
			outputData[index + 2] = b;
			outputData[index + 3] = a;
		}
	}
}

/**
 * Reduce la cantidad de colores en una imagen a un número específico de niveles
 */
export function reduceColors(inputData: ImageData, levels = 16): ImageData {
	const { width, height, data } = inputData;
	const outputData = new Uint8ClampedArray(data.length);

	// Asegurar que levels sea al menos 2 y como máximo 256
	const colorLevels = Math.max(2, Math.min(256, levels));

	// Factor para ajustar los valores
	const factor = 255 / (colorLevels - 1);

	// Aplicar reducción de colores a cada píxel
	for (let i = 0; i < data.length; i += 4) {
		// Cuantificar cada canal de color
		const r = Math.round(Math.round(data[i] / factor) * factor);
		const g = Math.round(Math.round(data[i + 1] / factor) * factor);
		const b = Math.round(Math.round(data[i + 2] / factor) * factor);

		// Aplicar los valores cuantificados
		outputData[i] = r;
		outputData[i + 1] = g;
		outputData[i + 2] = b;
		outputData[i + 3] = data[i + 3]; // Mantener el canal alfa
	}

	return new ImageData(outputData, width, height);
}

/**
 * Aplica pixelado con una máscara circular (afecta solo a una zona específica)
 */
export function applyPixelateWithSpot(
	inputData: ImageData,
	outputData: ImageData,
	spotCenter: { x: number; y: number },
	spotRadius: number,
	width: number,
	height: number
): ImageData {
	// Crear copia del resultado
	const resultData = new Uint8ClampedArray(inputData.data.length);

	// Convertir coordenadas de porcentaje (0-100) a píxeles
	const centerX = Math.floor((spotCenter.x / 100) * width);
	const centerY = Math.floor((spotCenter.y / 100) * height);

	// Calcular radio en píxeles
	const radiusPixels = Math.floor((spotRadius / 100) * Math.min(width, height));

	// Aplicar una mezcla entre la imagen original y el resultado pixelado
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 4;

			// Calcular distancia al centro del spot
			const dx = x - centerX;
			const dy = y - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// Determinar si está dentro del spot
			if (distance <= radiusPixels) {
				// Dentro del spot: usar imagen pixelada
				resultData[index] = outputData.data[index];
				resultData[index + 1] = outputData.data[index + 1];
				resultData[index + 2] = outputData.data[index + 2];
				resultData[index + 3] = outputData.data[index + 3];
			} else {
				// Fuera del spot: usar imagen original
				resultData[index] = inputData.data[index];
				resultData[index + 1] = inputData.data[index + 1];
				resultData[index + 2] = inputData.data[index + 2];
				resultData[index + 3] = inputData.data[index + 3];
			}
		}
	}

	return new ImageData(resultData, width, height);
}

/**
 * Función principal para pixelar una imagen con todas las opciones
 */
export function pixelateImage(sourceImageData: ImageData, options: PixelateOptions): ImageData {
	// Extraer opciones con valores por defecto
	const {
		pixelSize,
		algorithm = 'simple',
		applyToSpot = false,
		spotRadius = 50,
		spotPosition = { x: 50, y: 50 },
		colorReduction = false,
		colorLevels = 16,
	} = options;

	// Seleccionar el algoritmo de pixelado
	let pixelatedData: ImageData;
	switch (algorithm) {
		case 'weighted':
			pixelatedData = pixelateWeighted(sourceImageData, pixelSize, options);
			break;
		case 'adaptive':
			pixelatedData = pixelateAdaptive(sourceImageData, pixelSize, options);
			break;
		default:
			pixelatedData = pixelateSimple(sourceImageData, pixelSize, options);
	}

	// Aplicar reducción de colores si está habilitada
	if (colorReduction && colorLevels > 0) {
		pixelatedData = reduceColors(pixelatedData, colorLevels);
	}

	// Aplicar pixelado por zonas si está habilitado
	if (applyToSpot && spotRadius > 0) {
		pixelatedData = applyPixelateWithSpot(
			sourceImageData,
			pixelatedData,
			spotPosition,
			spotRadius,
			sourceImageData.width,
			sourceImageData.height
		);
	}

	return pixelatedData;
}

/**
 * Sistema de caché para mejorar rendimiento
 */
type PixelateCacheKey = string;
interface PixelateCacheEntry {
	imageData: ImageData;
	timestamp: number;
}

export class PixelateCache {
	private cache: Map<PixelateCacheKey, PixelateCacheEntry>;
	private maxSize: number;

	constructor(maxSize = 20) {
		this.cache = new Map();
		this.maxSize = maxSize;
	}

	/**
	 * Genera una clave de caché basada en los parámetros
	 */
	private generateKey(width: number, height: number, options: PixelateOptions): PixelateCacheKey {
		const { pixelSize, algorithm, applyToSpot, spotRadius, spotPosition, colorReduction, colorLevels } = options;

		return `${width}x${height}_px${pixelSize}_${algorithm}_spot${applyToSpot ? 1 : 0}_rad${spotRadius || 0}_x${spotPosition?.x || 0}_y${spotPosition?.y || 0}_cr${colorReduction ? 1 : 0}_cl${colorLevels || 0}`;
	}

	/**
	 * Obtiene una imagen pixelada del caché o la genera
	 */
	get(sourceData: ImageData, options: PixelateOptions): ImageData {
		const key = this.generateKey(sourceData.width, sourceData.height, options);

		// Verificar si existe en caché
		if (this.cache.has(key)) {
			const entry = this.cache.get(key);
			// Si entry existe, actualizar timestamp
			if (entry) {
				entry.timestamp = Date.now();
				return entry.imageData;
			}
		}

		// Generar imagen pixelada
		const pixelatedData = pixelateImage(sourceData, options);

		// Guardar en caché
		this.cache.set(key, {
			imageData: pixelatedData,
			timestamp: Date.now(),
		});

		// Limpiar caché si excede tamaño máximo
		if (this.cache.size > this.maxSize) {
			this.prune();
		}

		return pixelatedData;
	}

	/**
	 * Elimina entradas antiguas del caché
	 */
	private prune(): void {
		// Convertir a array para ordenar
		const entries = Array.from(this.cache.entries());

		// Ordenar por timestamp (más antiguo primero)
		entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

		// Eliminar el 20% más antiguo
		const pruneCount = Math.ceil(this.maxSize * 0.2);
		for (let i = 0; i < pruneCount && i < entries.length; i++) {
			this.cache.delete(entries[i][0]);
		}
	}

	/**
	 * Limpia todo el caché
	 */
	clear(): void {
		this.cache.clear();
	}
}

// Instancia global del caché
export const pixelateCache = new PixelateCache();
