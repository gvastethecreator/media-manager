/**
 * Algoritmos de ruido procedural para Noise Texture Layer
 * Implementación de Perlin Noise y Simplex Noise optimizada para rendimiento en tiempo real
 */

// Constantes para el algoritmo de Perlin Noise
const PERMUTATION_TABLE = Array.from({ length: 256 }, (_, i) => i);

// Función para mezclar la tabla de permutación usando una semilla
function shufflePermutationTable(seed: number): number[] {
	const perm = [...PERMUTATION_TABLE];

	// Algoritmo Fisher-Yates shuffle
	let currentIndex = perm.length;
	let randomIndex = 0;

	// Generador pseudo-aleatorio determinista basado en semilla
	const random = () => {
		const x = Math.sin(seed + randomIndex++) * 10000;
		return x - Math.floor(x);
	};

	// Mezclar el array
	while (currentIndex !== 0) {
		randomIndex = Math.floor(random() * currentIndex);
		currentIndex--;
		[perm[currentIndex], perm[randomIndex]] = [perm[randomIndex], perm[currentIndex]];
	}

	// Extender a 512 elementos para facilitar operaciones
	return [...perm, ...perm];
}

// Función para interpolar suavemente entre dos valores
function smoothstep(t: number): number {
	return t * t * (3 - 2 * t);
}

// Función para generar un gradiente aleatorio
function getGradient(hash: number): [number, number] {
	// 8 vectores de gradiente posibles
	const gradients: [number, number][] = [
		[1, 1],
		[-1, 1],
		[1, -1],
		[-1, -1],
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	];

	return gradients[hash & 7];
}

// Función para calcular el producto punto entre un gradiente y un vector de distancia
function dotProduct(gradient: [number, number], x: number, y: number): number {
	return gradient[0] * x + gradient[1] * y;
}

/**
 * Implementación del algoritmo de Perlin Noise 2D
 * Genera valores de ruido entre 0 y 1 para coordenadas (x, y)
 */
export function perlinNoise(x: number, y: number, seed = 0, scale = 1): number {
	// Escalar las coordenadas
	x *= scale;
	y *= scale;

	// Tabla de permutación mezclada por semilla
	const perm = shufflePermutationTable(seed);

	// Coordenadas de celda
	const xi = Math.floor(x) & 255;
	const yi = Math.floor(y) & 255;

	// Coordenadas relativas dentro de la celda (0-1)
	const xf = x - Math.floor(x);
	const yf = y - Math.floor(y);

	// Coordenadas con suavizado
	const u = smoothstep(xf);
	const v = smoothstep(yf);

	// Obtener índices para cada esquina
	const aaa = perm[perm[xi] + yi];
	const aba = perm[perm[xi] + yi + 1];
	const baa = perm[perm[xi + 1] + yi];
	const bba = perm[perm[xi + 1] + yi + 1];

	// Obtener gradientes y calcular producto punto con distancia
	const g1 = getGradient(aaa);
	const g2 = getGradient(baa);
	const g3 = getGradient(aba);
	const g4 = getGradient(bba);

	const d1 = dotProduct(g1, xf, yf);
	const d2 = dotProduct(g2, xf - 1, yf);
	const d3 = dotProduct(g3, xf, yf - 1);
	const d4 = dotProduct(g4, xf - 1, yf - 1);

	// Interpolar resultados en X
	const x1 = d1 + u * (d2 - d1);
	const x2 = d3 + u * (d4 - d3);

	// Interpolar resultados en Y
	const result = x1 + v * (x2 - x1);

	// Normalizar a 0-1
	return (result + 1) / 2;
}

/**
 * Genera Perlin Noise con múltiples octavas para mayor detalle
 * @param x Coordenada X
 * @param y Coordenada Y
 * @param seed Semilla para generar el ruido
 * @param octaves Número de capas de detalle
 * @param persistence Cuánto contribuye cada octava (0-1)
 * @param scale Escala base del ruido
 */
export function perlinNoiseOctaves(x: number, y: number, seed = 0, octaves = 4, persistence = 0.5, scale = 1): number {
	let total = 0;
	let frequency = 1;
	let amplitude = 1;
	let maxValue = 0;

	for (let i = 0; i < octaves; i++) {
		total += perlinNoise(x * frequency, y * frequency, seed + i, scale) * amplitude;

		maxValue += amplitude;
		amplitude *= persistence;
		frequency *= 2;
	}

	// Normalizar el resultado
	return total / maxValue;
}

/**
 * Constantes para el algoritmo Simplex Noise
 */
const SIMPLEX_SKEW = 0.5 * (Math.sqrt(3) - 1);
const SIMPLEX_UNSKEW = (3 - Math.sqrt(3)) / 6;

// Vértices de un triángulo simplex
const SIMPLEX_GRAD3: [number, number, number][] = [
	[1, 1, 0],
	[-1, 1, 0],
	[1, -1, 0],
	[-1, -1, 0],
	[1, 0, 1],
	[-1, 0, 1],
	[1, 0, -1],
	[-1, 0, -1],
	[0, 1, 1],
	[0, -1, 1],
	[0, 1, -1],
	[0, -1, -1],
];

/**
 * Implementación del algoritmo Simplex Noise 2D
 * Genera valores de ruido entre 0 y 1 para coordenadas (x, y)
 */
export function simplexNoise(x: number, y: number, seed = 0, scale = 1): number {
	// Escalar las coordenadas
	x *= scale;
	y *= scale;

	// Tabla de permutación mezclada por semilla
	const perm = shufflePermutationTable(seed);

	// Transformación para triángulos equiláteros
	const s = (x + y) * SIMPLEX_SKEW;
	const i = Math.floor(x + s);
	const j = Math.floor(y + s);

	// Deshacer transformación para las esquinas
	const t = (i + j) * SIMPLEX_UNSKEW;
	const X0 = i - t;
	const Y0 = j - t;

	// Coordenadas relativas
	const x0 = x - X0;
	const y0 = y - Y0;

	// Determinar en qué triángulo estamos
	const i1 = x0 > y0 ? 1 : 0;
	const j1 = x0 > y0 ? 0 : 1;

	// Calcular coordenadas de las otras esquinas del simplex
	const x1 = x0 - i1 + SIMPLEX_UNSKEW;
	const y1 = y0 - j1 + SIMPLEX_UNSKEW;
	const x2 = x0 - 1 + 2 * SIMPLEX_UNSKEW;
	const y2 = y0 - 1 + 2 * SIMPLEX_UNSKEW;

	// Calcular índices hash
	const ii = i & 255;
	const jj = j & 255;

	const gi0 = perm[ii + perm[jj]] % 12;
	const gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
	const gi2 = perm[ii + 1 + perm[jj + 1]] % 12;

	// Calcular contribución de cada esquina
	const t0 = 0.5 - x0 * x0 - y0 * y0;
	let n0 = 0;
	if (t0 >= 0) {
		n0 = t0 * t0 * t0 * t0 * (SIMPLEX_GRAD3[gi0][0] * x0 + SIMPLEX_GRAD3[gi0][1] * y0);
	}

	const t1 = 0.5 - x1 * x1 - y1 * y1;
	let n1 = 0;
	if (t1 >= 0) {
		n1 = t1 * t1 * t1 * t1 * (SIMPLEX_GRAD3[gi1][0] * x1 + SIMPLEX_GRAD3[gi1][1] * y1);
	}

	const t2 = 0.5 - x2 * x2 - y2 * y2;
	let n2 = 0;
	if (t2 >= 0) {
		n2 = t2 * t2 * t2 * t2 * (SIMPLEX_GRAD3[gi2][0] * x2 + SIMPLEX_GRAD3[gi2][1] * y2);
	}

	// Escalar a [-1, 1]
	const noise = 70 * (n0 + n1 + n2);

	// Normalizar a [0, 1]
	return (noise + 1) / 2;
}

/**
 * Genera Simplex Noise con múltiples octavas para mayor detalle
 */
export function simplexNoiseOctaves(x: number, y: number, seed = 0, octaves = 4, persistence = 0.5, scale = 1): number {
	let total = 0;
	let frequency = 1;
	let amplitude = 1;
	let maxValue = 0;

	for (let i = 0; i < octaves; i++) {
		total += simplexNoise(x * frequency, y * frequency, seed + i, scale) * amplitude;

		maxValue += amplitude;
		amplitude *= persistence;
		frequency *= 2;
	}

	// Normalizar el resultado
	return total / maxValue;
}

/**
 * Genera un mapa de ruido 2D usando el algoritmo especificado
 */
export function generateNoiseMap(
	width: number,
	height: number,
	algorithm: 'perlin' | 'simplex' | 'fractalNoise' = 'perlin',
	options = {
		seed: 0,
		scale: 1,
		octaves: 4,
		persistence: 0.5,
	}
): number[][] {
	const map: number[][] = [];

	for (let y = 0; y < height; y++) {
		const row: number[] = [];
		for (let x = 0; x < width; x++) {
			const nx = x / width;
			const ny = y / height;

			let value = 0;

			if (algorithm === 'perlin') {
				value = perlinNoiseOctaves(nx, ny, options.seed, options.octaves, options.persistence, options.scale);
			} else if (algorithm === 'simplex') {
				value = simplexNoiseOctaves(nx, ny, options.seed, options.octaves, options.persistence, options.scale);
			} else {
				// Para 'fractalNoise', usar perlin con configuración específica
				value = perlinNoiseOctaves(
					nx,
					ny,
					options.seed,
					Math.min(8, options.octaves), // más octavas para fractal
					options.persistence * 0.8, // reducir persistencia
					options.scale * 1.5 // aumentar escala
				);
			}

			row.push(value);
		}
		map.push(row);
	}

	return map;
}

/**
 * Convierte un mapa de ruido a datos de imagen en formato RGBA
 */
export function noiseMapToImageData(noiseMap: number[][], color = 'rgba(255, 255, 255, 1)', intensity = 1): ImageData {
	const width = noiseMap[0].length;
	const height = noiseMap.length;
	const data = new Uint8ClampedArray(width * height * 4);

	// Parsear el color (asumiendo formato rgba)
	const colorMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/);
	const [r, g, b, a = 1] = colorMatch
		? [
				Number.parseInt(colorMatch[1]),
				Number.parseInt(colorMatch[2]),
				Number.parseInt(colorMatch[3]),
				Number.parseFloat(colorMatch[4] || '1'),
			]
		: [255, 255, 255, 1];

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const value = noiseMap[y][x] * intensity;
			const index = (y * width + x) * 4;

			data[index] = r;
			data[index + 1] = g;
			data[index + 2] = b;
			data[index + 3] = Math.floor(value * 255 * a);
		}
	}

	return new ImageData(data, width, height);
}

/**
 * Sistema de caché para mapas de ruido
 */
type NoiseMapCacheKey = string;
interface NoiseMapCacheEntry {
	map: number[][];
	timestamp: number;
	version: number;
}

class NoiseMapCache {
	private cache: Map<NoiseMapCacheKey, NoiseMapCacheEntry>;
	private maxSize: number;
	private currentVersion: number;

	constructor(maxSize = 50) {
		this.cache = new Map();
		this.maxSize = maxSize;
		this.currentVersion = 1;
	}

	/**
	 * Genera una clave de caché basada en los parámetros
	 */
	private generateKey(
		width: number,
		height: number,
		algorithm: string,
		seed: number,
		scale: number,
		octaves: number,
		persistence: number
	): NoiseMapCacheKey {
		return `${algorithm}_${width}x${height}_s${seed}_sc${scale}_o${octaves}_p${persistence}`;
	}

	/**
	 * Obtiene un mapa de ruido del caché o lo genera si no existe
	 */
	get(
		width: number,
		height: number,
		algorithm: 'perlin' | 'simplex' | 'fractalNoise' = 'perlin',
		options = {
			seed: 0,
			scale: 1,
			octaves: 4,
			persistence: 0.5,
		}
	): number[][] {
		const key = this.generateKey(
			width,
			height,
			algorithm,
			options.seed,
			options.scale,
			options.octaves,
			options.persistence
		);

		// Verificar si existe en caché
		if (this.cache.has(key)) {
			const entry = this.cache.get(key)!;
			// Actualizar timestamp para LRU
			entry.timestamp = Date.now();
			return entry.map;
		}

		// Generar nuevo mapa
		const map = generateNoiseMap(width, height, algorithm, options);

		// Guardar en caché
		this.cache.set(key, {
			map,
			timestamp: Date.now(),
			version: this.currentVersion,
		});

		// Limpiar caché si excede tamaño máximo
		if (this.cache.size > this.maxSize) {
			this.prune();
		}

		return map;
	}

	/**
	 * Elimina entradas antiguas del caché según LRU
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
	 * Invalida todas las entradas del caché
	 */
	invalidateAll(): void {
		this.cache.clear();
		this.currentVersion++;
	}

	/**
	 * Invalida entradas específicas del caché basadas en un patrón
	 */
	invalidateByPattern(pattern: string): void {
		for (const key of this.cache.keys()) {
			if (key.includes(pattern)) {
				this.cache.delete(key);
			}
		}
	}
}

// Exportar singleton del caché
export const noiseCache = new NoiseMapCache(100);
