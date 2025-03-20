/**
 * Algoritmos de pixelado para la capa Pixelate
 */

/**
 * Aplica un efecto de pixelado simple a los datos de imagen
 * @param imageData Datos de la imagen original
 * @param pixelSize Tamaño del pixel (mayor = más pixelado)
 * @returns Datos de imagen pixelada
 */
export function simplePixelate(imageData: ImageData, pixelSize: number): ImageData {
	const { width, height, data } = imageData;
	const result = new ImageData(width, height);
	const resultData = result.data;

	// Asegurarse de que el tamaño del pixel sea al menos 1
	const size = Math.max(1, Math.floor(pixelSize));

	// Recorrer la imagen por bloques de pixelSize x pixelSize
	for (let y = 0; y < height; y += size) {
		for (let x = 0; x < width; x += size) {
			// Calcular el color promedio del bloque
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			let count = 0;

			// Recorrer el bloque
			for (let blockY = 0; blockY < size && y + blockY < height; blockY++) {
				for (let blockX = 0; blockX < size && x + blockX < width; blockX++) {
					const idx = ((y + blockY) * width + (x + blockX)) * 4;
					r += data[idx];
					g += data[idx + 1];
					b += data[idx + 2];
					a += data[idx + 3];
					count++;
				}
			}

			// Calcular el promedio
			r = Math.floor(r / count);
			g = Math.floor(g / count);
			b = Math.floor(b / count);
			a = Math.floor(a / count);

			// Aplicar el color promedio a todo el bloque
			for (let blockY = 0; blockY < size && y + blockY < height; blockY++) {
				for (let blockX = 0; blockX < size && x + blockX < width; blockX++) {
					const idx = ((y + blockY) * width + (x + blockX)) * 4;
					resultData[idx] = r;
					resultData[idx + 1] = g;
					resultData[idx + 2] = b;
					resultData[idx + 3] = a;
				}
			}
		}
	}

	return result;
}

/**
 * Aplica un efecto de pixelado ponderado a los datos de imagen
 * @param imageData Datos de la imagen original
 * @param pixelSize Tamaño del pixel (mayor = más pixelado)
 * @returns Datos de imagen pixelada
 */
export function weightedPixelate(imageData: ImageData, pixelSize: number): ImageData {
	const { width, height, data } = imageData;
	const result = new ImageData(width, height);
	const resultData = result.data;

	// Asegurarse de que el tamaño del pixel sea al menos 1
	const size = Math.max(1, Math.floor(pixelSize));

	// Recorrer la imagen por bloques de pixelSize x pixelSize
	for (let y = 0; y < height; y += size) {
		for (let x = 0; x < width; x += size) {
			// Calcular el color ponderado del bloque (los píxeles centrales tienen más peso)
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			let totalWeight = 0;

			// Calcular el centro del bloque
			const centerX = x + size / 2;
			const centerY = y + size / 2;

			// Recorrer el bloque
			for (let blockY = 0; blockY < size && y + blockY < height; blockY++) {
				for (let blockX = 0; blockX < size && x + blockX < width; blockX++) {
					const idx = ((y + blockY) * width + (x + blockX)) * 4;

					// Calcular la distancia al centro del bloque (normalizada)
					const distX = (x + blockX - centerX) / size;
					const distY = (y + blockY - centerY) / size;
					const dist = Math.sqrt(distX * distX + distY * distY);

					// Calcular el peso (los píxeles más cercanos al centro tienen más peso)
					const weight = 1 - Math.min(1, dist);

					r += data[idx] * weight;
					g += data[idx + 1] * weight;
					b += data[idx + 2] * weight;
					a += data[idx + 3] * weight;
					totalWeight += weight;
				}
			}

			// Calcular el promedio ponderado
			r = Math.floor(r / totalWeight);
			g = Math.floor(g / totalWeight);
			b = Math.floor(b / totalWeight);
			a = Math.floor(a / totalWeight);

			// Aplicar el color promedio a todo el bloque
			for (let blockY = 0; blockY < size && y + blockY < height; blockY++) {
				for (let blockX = 0; blockX < size && x + blockX < width; blockX++) {
					const idx = ((y + blockY) * width + (x + blockX)) * 4;
					resultData[idx] = r;
					resultData[idx + 1] = g;
					resultData[idx + 2] = b;
					resultData[idx + 3] = a;
				}
			}
		}
	}

	return result;
}

/**
 * Aplica un efecto de pixelado adaptativo a los datos de imagen
 * @param imageData Datos de la imagen original
 * @param pixelSize Tamaño base del pixel (mayor = más pixelado)
 * @returns Datos de imagen pixelada
 */
export function adaptativePixelate(imageData: ImageData, pixelSize: number): ImageData {
	const { width, height, data } = imageData;
	const result = new ImageData(width, height);
	const resultData = result.data;

	// Asegurarse de que el tamaño del pixel sea al menos 1
	const baseSize = Math.max(1, Math.floor(pixelSize));

	// Calcular la varianza de cada región para determinar el tamaño del pixel
	const blockSize = Math.max(4, baseSize); // Tamaño mínimo para calcular la varianza

	// Recorrer la imagen por bloques
	for (let y = 0; y < height; y += blockSize) {
		for (let x = 0; x < width; x += blockSize) {
			// Calcular la varianza del bloque
			let sum = 0;
			let sumSq = 0;
			let count = 0;

			// Recorrer el bloque para calcular la varianza
			for (let blockY = 0; blockY < blockSize && y + blockY < height; blockY++) {
				for (let blockX = 0; blockX < blockSize && x + blockX < width; blockX++) {
					const idx = ((y + blockY) * width + (x + blockX)) * 4;
					// Usar la luminancia (0.3R + 0.59G + 0.11B) como valor
					const value = 0.3 * data[idx] + 0.59 * data[idx + 1] + 0.11 * data[idx + 2];
					sum += value;
					sumSq += value * value;
					count++;
				}
			}

			// Calcular la varianza
			const mean = sum / count;
			const variance = sumSq / count - mean * mean;

			// Determinar el tamaño del pixel basado en la varianza
			// Áreas con alta varianza (detalles) tienen píxeles más pequeños
			const varianceFactor = Math.min(1, Math.max(0.1, 1 - variance / 2000));
			const adaptiveSize = Math.max(1, Math.floor(baseSize * varianceFactor));

			// Aplicar pixelado con el tamaño adaptativo
			for (let subY = 0; subY < blockSize; subY += adaptiveSize) {
				if (y + subY >= height) {
					break;
				}

				for (let subX = 0; subX < blockSize; subX += adaptiveSize) {
					if (x + subX >= width) {
						break;
					}

					// Calcular el color promedio del sub-bloque
					let r = 0;
					let g = 0;
					let b = 0;
					let a = 0;
					let subCount = 0;

					for (let pixY = 0; pixY < adaptiveSize && y + subY + pixY < height; pixY++) {
						for (let pixX = 0; pixX < adaptiveSize && x + subX + pixX < width; pixX++) {
							const idx = ((y + subY + pixY) * width + (x + subX + pixX)) * 4;
							r += data[idx];
							g += data[idx + 1];
							b += data[idx + 2];
							a += data[idx + 3];
							subCount++;
						}
					}

					// Calcular el promedio
					r = Math.floor(r / subCount);
					g = Math.floor(g / subCount);
					b = Math.floor(b / subCount);
					a = Math.floor(a / subCount);

					// Aplicar el color promedio al sub-bloque
					for (let pixY = 0; pixY < adaptiveSize && y + subY + pixY < height; pixY++) {
						for (let pixX = 0; pixX < adaptiveSize && x + subX + pixX < width; pixX++) {
							const idx = ((y + subY + pixY) * width + (x + subX + pixX)) * 4;
							resultData[idx] = r;
							resultData[idx + 1] = g;
							resultData[idx + 2] = b;
							resultData[idx + 3] = a;
						}
					}
				}
			}
		}
	}

	return result;
}

/**
 * Reduce la cantidad de colores en una imagen
 * @param imageData Datos de la imagen original
 * @param levels Número de niveles por canal (2-256)
 * @returns Datos de imagen con colores reducidos
 */
export function reduceColors(imageData: ImageData, levels: number): ImageData {
	const { width, height, data } = imageData;
	const result = new ImageData(width, height);
	const resultData = result.data;

	// Asegurarse de que levels esté entre 2 y 256
	const numLevels = Math.max(2, Math.min(256, levels));
	const factor = 255 / (numLevels - 1);

	// Recorrer todos los píxeles
	for (let i = 0; i < data.length; i += 4) {
		// Reducir cada canal de color
		resultData[i] = Math.round(Math.round(data[i] / factor) * factor);
		resultData[i + 1] = Math.round(Math.round(data[i + 1] / factor) * factor);
		resultData[i + 2] = Math.round(Math.round(data[i + 2] / factor) * factor);
		resultData[i + 3] = data[i + 3]; // Mantener el canal alfa original
	}

	return result;
}

/**
 * Objeto con todos los algoritmos de pixelado
 */
export const pixelateAlgorithms = {
	simple: simplePixelate,
	weighted: weightedPixelate,
	adaptative: adaptativePixelate,
};
