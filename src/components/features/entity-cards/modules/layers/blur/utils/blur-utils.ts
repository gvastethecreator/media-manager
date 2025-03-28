import type { BlurConfig } from '../blur-schema';

interface BlurEffectOptions extends Omit<BlurConfig, 'type'> {
	time: number;
}

/**
 * 🌫️ Aplica el efecto de desenfoque a los datos de imagen
 */
export function applyBlurEffect(imageData: ImageData, options: BlurEffectOptions): ImageData {
	const { algorithm, radius, quality, zone, motion, preserveEdges, edgeThreshold, time, animationSpeed } = options;

	// Crear una copia de los datos de imagen
	const result = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

	// Aplicar el algoritmo de desenfoque seleccionado
	switch (algorithm) {
		case 'gaussian':
			applyGaussianBlur(result, radius, quality);
			break;
		case 'box':
			applyBoxBlur(result, radius, quality);
			break;
		case 'motion':
			applyMotionBlur(result, radius, motion, time, animationSpeed);
			break;
		case 'radial':
			applyRadialBlur(result, radius, zone);
			break;
		case 'zoom':
			applyZoomBlur(result, radius, zone, time, animationSpeed);
			break;
	}

	// Aplicar preservación de bordes si está activada
	if (preserveEdges) {
		preserveImageEdges(result, imageData, edgeThreshold);
	}

	// Aplicar zona de efecto si está definida
	if (zone && algorithm !== 'radial' && algorithm !== 'zoom') {
		applyZoneEffect(result, imageData, zone);
	}

	return result;
}

/**
 * 🎯 Aplica desenfoque gaussiano
 */
function applyGaussianBlur(imageData: ImageData, radius: number, quality: BlurConfig['quality']): void {
	const iterations = getQualityIterations(quality);
	const sigma = radius / 3;
	const kernel = createGaussianKernel(sigma);

	for (let i = 0; i < iterations; i++) {
		applyConvolution(imageData, kernel);
	}
}

/**
 * 📦 Aplica desenfoque de caja
 */
function applyBoxBlur(imageData: ImageData, radius: number, quality: BlurConfig['quality']): void {
	const iterations = getQualityIterations(quality);
	const size = Math.ceil(radius);

	for (let i = 0; i < iterations; i++) {
		applyBoxFilter(imageData, size);
	}
}

/**
 * 🏃‍♂️ Aplica desenfoque de movimiento
 */
function applyMotionBlur(
	imageData: ImageData,
	radius: number,
	motion: BlurConfig['motion'],
	time: number,
	speed: number
): void {
	if (!motion) return;

	const angle = motion.angle + ((time * speed) % 360);
	const distance = motion.distance;

	applyDirectionalBlur(imageData, angle, distance);
}

/**
 * 🎯 Aplica desenfoque radial
 */
function applyRadialBlur(imageData: ImageData, radius: number, zone: BlurConfig['zone']): void {
	if (!zone || zone.type !== 'circle') return;

	const { center, radius: zoneRadius, feather } = zone;
	const centerX = center.x * imageData.width;
	const centerY = center.y * imageData.height;

	applyRadialFilter(imageData, centerX, centerY, zoneRadius, feather, radius);
}

/**
 * 🔍 Aplica desenfoque de zoom
 */
function applyZoomBlur(
	imageData: ImageData,
	radius: number,
	zone: BlurConfig['zone'],
	time: number,
	speed: number
): void {
	if (!zone || zone.type !== 'circle') return;

	const { center } = zone;
	const zoomFactor = 1 + Math.sin(time * speed) * 0.1;

	applyZoomFilter(imageData, center.x * imageData.width, center.y * imageData.height, radius, zoomFactor);
}

/**
 * 🎨 Preserva los bordes de la imagen original
 */
function preserveImageEdges(result: ImageData, original: ImageData, threshold: number): void {
	const data = result.data;
	const origData = original.data;
	const len = data.length;

	for (let i = 0; i < len; i += 4) {
		const diff =
			Math.abs(data[i] - origData[i]) +
			Math.abs(data[i + 1] - origData[i + 1]) +
			Math.abs(data[i + 2] - origData[i + 2]);

		if (diff > threshold) {
			data[i] = origData[i];
			data[i + 1] = origData[i + 1];
			data[i + 2] = origData[i + 2];
		}
	}
}

/**
 * 🎯 Aplica el efecto solo en la zona especificada
 */
function applyZoneEffect(result: ImageData, original: ImageData, zone: BlurConfig['zone']): void {
	if (!zone) return;

	const data = result.data;
	const origData = original.data;
	const width = result.width;
	const height = result.height;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const factor = getZoneFactor(x / width, y / height, zone);

			data[i] = origData[i] * (1 - factor) + data[i] * factor;
			data[i + 1] = origData[i + 1] * (1 - factor) + data[i + 1] * factor;
			data[i + 2] = origData[i + 2] * (1 - factor) + data[i + 2] * factor;
		}
	}
}

/**
 * 🔢 Obtiene el número de iteraciones según la calidad
 */
function getQualityIterations(quality: BlurConfig['quality']): number {
	switch (quality) {
		case 'low':
			return 1;
		case 'medium':
			return 2;
		case 'high':
			return 3;
		default:
			return 2;
	}
}

/**
 * 📊 Crea un kernel gaussiano
 */
function createGaussianKernel(sigma: number): number[] {
	const size = Math.ceil(sigma * 6);
	const kernel = new Array(size);
	const twoSigmaSquare = 2 * sigma * sigma;
	let sum = 0;

	for (let i = 0; i < size; i++) {
		const x = i - Math.floor(size / 2);
		kernel[i] = Math.exp(-(x * x) / twoSigmaSquare);
		sum += kernel[i];
	}

	// Normalizar el kernel
	for (let i = 0; i < size; i++) {
		kernel[i] /= sum;
	}

	return kernel;
}

/**
 * 🎨 Aplica un filtro de convolución
 */
function applyConvolution(imageData: ImageData, kernel: number[]): void {
	// Implementación del filtro de convolución
	// Esta es una implementación básica que debe ser optimizada para producción
	const { data, width, height } = imageData;
	const temp = new Uint8ClampedArray(data);
	const kernelSize = kernel.length;
	const radius = Math.floor(kernelSize / 2);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let r = 0,
				g = 0,
				b = 0;

			for (let k = -radius; k <= radius; k++) {
				const px = Math.min(Math.max(x + k, 0), width - 1);
				const i = (y * width + px) * 4;
				const w = kernel[k + radius];

				r += temp[i] * w;
				g += temp[i + 1] * w;
				b += temp[i + 2] * w;
			}

			const i = (y * width + x) * 4;
			data[i] = r;
			data[i + 1] = g;
			data[i + 2] = b;
		}
	}
}

/**
 * 📦 Aplica un filtro de caja
 */
function applyBoxFilter(imageData: ImageData, size: number): void {
	const { data, width, height } = imageData;
	const temp = new Uint8ClampedArray(data);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let r = 0,
				g = 0,
				b = 0,
				count = 0;

			for (let dy = -size; dy <= size; dy++) {
				for (let dx = -size; dx <= size; dx++) {
					const px = Math.min(Math.max(x + dx, 0), width - 1);
					const py = Math.min(Math.max(y + dy, 0), height - 1);
					const i = (py * width + px) * 4;

					r += temp[i];
					g += temp[i + 1];
					b += temp[i + 2];
					count++;
				}
			}

			const i = (y * width + x) * 4;
			data[i] = r / count;
			data[i + 1] = g / count;
			data[i + 2] = b / count;
		}
	}
}

/**
 * 🏃‍♂️ Aplica un filtro direccional
 */
function applyDirectionalBlur(imageData: ImageData, angle: number, distance: number): void {
	const { data, width, height } = imageData;
	const temp = new Uint8ClampedArray(data);
	const rad = (angle * Math.PI) / 180;
	const dx = Math.cos(rad);
	const dy = Math.sin(rad);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let r = 0,
				g = 0,
				b = 0,
				count = 0;

			for (let t = -distance; t <= distance; t++) {
				const px = Math.min(Math.max(Math.round(x + dx * t), 0), width - 1);
				const py = Math.min(Math.max(Math.round(y + dy * t), 0), height - 1);
				const i = (py * width + px) * 4;

				r += temp[i];
				g += temp[i + 1];
				b += temp[i + 2];
				count++;
			}

			const i = (y * width + x) * 4;
			data[i] = r / count;
			data[i + 1] = g / count;
			data[i + 2] = b / count;
		}
	}
}

/**
 * 🎯 Aplica un filtro radial
 */
function applyRadialFilter(
	imageData: ImageData,
	centerX: number,
	centerY: number,
	radius: number,
	feather: number,
	blurRadius: number
): void {
	const { data, width, height } = imageData;
	const temp = new Uint8ClampedArray(data);
	const maxRadius = Math.sqrt(width * width + height * height) * radius;
	const featherSize = maxRadius * feather;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const dx = x - centerX;
			const dy = y - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const factor = Math.max(0, Math.min(1, (distance - maxRadius + featherSize) / featherSize));

			if (factor > 0) {
				let r = 0,
					g = 0,
					b = 0,
					count = 0;
				const size = Math.ceil(blurRadius * factor);

				for (let ky = -size; ky <= size; ky++) {
					for (let kx = -size; kx <= size; kx++) {
						const px = Math.min(Math.max(x + kx, 0), width - 1);
						const py = Math.min(Math.max(y + ky, 0), height - 1);
						const i = (py * width + px) * 4;

						r += temp[i];
						g += temp[i + 1];
						b += temp[i + 2];
						count++;
					}
				}

				const i = (y * width + x) * 4;
				data[i] = r / count;
				data[i + 1] = g / count;
				data[i + 2] = b / count;
			}
		}
	}
}

/**
 * 🔍 Aplica un filtro de zoom
 */
function applyZoomFilter(
	imageData: ImageData,
	centerX: number,
	centerY: number,
	radius: number,
	zoomFactor: number
): void {
	const { data, width, height } = imageData;
	const temp = new Uint8ClampedArray(data);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const dx = x - centerX;
			const dy = y - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const factor = Math.max(0, Math.min(1, distance / (radius * width)));

			const scale = 1 + (zoomFactor - 1) * (1 - factor);
			const srcX = centerX + (x - centerX) / scale;
			const srcY = centerY + (y - centerY) / scale;

			if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
				const fx = srcX - Math.floor(srcX);
				const fy = srcY - Math.floor(srcY);

				const x0 = Math.floor(srcX);
				const y0 = Math.floor(srcY);
				const x1 = Math.min(x0 + 1, width - 1);
				const y1 = Math.min(y0 + 1, height - 1);

				const i00 = (y0 * width + x0) * 4;
				const i01 = (y0 * width + x1) * 4;
				const i10 = (y1 * width + x0) * 4;
				const i11 = (y1 * width + x1) * 4;

				const i = (y * width + x) * 4;

				for (let c = 0; c < 3; c++) {
					const p00 = temp[i00 + c];
					const p01 = temp[i01 + c];
					const p10 = temp[i10 + c];
					const p11 = temp[i11 + c];

					data[i + c] = Math.round(
						p00 * (1 - fx) * (1 - fy) + p01 * fx * (1 - fy) + p10 * (1 - fx) * fy + p11 * fx * fy
					);
				}
			}
		}
	}
}

/**
 * 🎯 Calcula el factor de la zona
 */
function getZoneFactor(x: number, y: number, zone: BlurConfig['zone']): number {
	if (!zone) return 1;

	switch (zone.type) {
		case 'circle': {
			const dx = x - zone.center.x;
			const dy = y - zone.center.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const featherStart = zone.radius - zone.feather;

			if (distance < featherStart) return 1;
			if (distance > zone.radius) return 0;

			return 1 - (distance - featherStart) / zone.feather;
		}

		case 'rectangle': {
			const { position, size, feather } = zone;
			const left = position.x;
			const top = position.y;
			const right = left + size.width;
			const bottom = top + size.height;

			const dx = Math.min(Math.max(0, x - left), size.width);
			const dy = Math.min(Math.max(0, y - top), size.height);

			const edgeX = Math.min(dx, size.width - dx) / feather;
			const edgeY = Math.min(dy, size.height - dy) / feather;
			const edge = Math.min(edgeX, edgeY);

			if (x < left || x > right || y < top || y > bottom) return 0;
			if (edge >= 1) return 1;

			return edge;
		}

		default:
			return 1;
	}
}
