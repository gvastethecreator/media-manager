import type { GrainConfig } from '../actions/grain-config.action';

interface GrainPatternOptions extends Partial<GrainConfig> {
  width: number;
  height: number;
  time?: number;
}

// Función principal para generar el patrón de grano
export function generateGrainPattern(
  ctx: CanvasRenderingContext2D,
  options: GrainPatternOptions
): void {
  const {
    width,
    height,
    pattern = 'perlin',
    intensity = 0.15,
    size = 1,
    colorMode = 'monochrome',
    roughness = 0.5,
    distribution = 'gaussian',
    fractalNoise = false,
    seed = 42,
    time = 0,
  } = options;

  // Crear ImageData para manipular píxeles directamente
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Inicializar generador de números aleatorios con semilla
  const random = createSeededRandom(seed + Math.floor(time));

  // Seleccionar función de generación de ruido según el patrón
  const noiseFunction = getNoiseFunction(pattern);

  // Escala del ruido
  const scale = 1 / (size * 100);

  // Generar ruido para cada píxel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Generar valor de ruido
      let noise = noiseFunction(x * scale, y * scale, time);

      // Aplicar distribución
      noise = applyDistribution(noise, distribution);

      // Aplicar ruido fractal si está habilitado
      if (fractalNoise) {
        noise = generateFractalNoise(x, y, scale, time, noiseFunction, roughness);
      }

      // Escalar según intensidad
      noise = noise * intensity;

      // Aplicar color según el modo
      if (colorMode === 'monochrome') {
        const value = Math.floor(128 + noise * 128);
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 255;   // A
      } else {
        data[i] = Math.floor(128 + noise * 128);     // R
        data[i + 1] = Math.floor(128 + noise * 64);  // G
        data[i + 2] = Math.floor(128 + noise * 32);  // B
        data[i + 3] = 255;                           // A
      }
    }
  }

  // Dibujar el patrón en el canvas
  ctx.putImageData(imageData, 0, 0);
}

// Generador de números aleatorios con semilla
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Obtener función de ruido según el patrón
function getNoiseFunction(pattern: GrainConfig['pattern']) {
  switch (pattern) {
    case 'perlin':
      return generatePerlinNoise;
    case 'simplex':
      return generateSimplexNoise;
    case 'worley':
      return generateWorleyNoise;
    default:
      return generatePerlinNoise;
  }
}

// Aplicar distribución al valor de ruido
function applyDistribution(value: number, distribution: GrainConfig['distribution']): number {
  switch (distribution) {
    case 'gaussian':
      // Aproximación de distribución gaussiana
      value = (value + value + value + random()) * 0.25;
      break;
    case 'uniform':
      // Mantener distribución uniforme
      break;
  }
  return value;
}

// Generar ruido fractal
function generateFractalNoise(
  x: number,
  y: number,
  scale: number,
  time: number,
  noiseFunction: (x: number, y: number, t: number) => number,
  roughness: number
): number {
  let noise = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < 4; i++) {
    noise += amplitude * noiseFunction(x * frequency * scale, y * frequency * scale, time);
    maxValue += amplitude;
    amplitude *= roughness;
    frequency *= 2;
  }

  return noise / maxValue;
}

// Implementación de Perlin Noise
function generatePerlinNoise(x: number, y: number, t: number): number {
  // Implementación simplificada de Perlin Noise
  return Math.sin(x * 10 + t) * Math.cos(y * 10 + t) * 0.5 + 0.5;
}

// Implementación de Simplex Noise
function generateSimplexNoise(x: number, y: number, t: number): number {
  // Implementación simplificada de Simplex Noise
  return (Math.sin(x * 12.9898 + y * 78.233 + t) * 43758.5453123) % 1;
}

// Implementación de Worley Noise
function generateWorleyNoise(x: number, y: number, t: number): number {
  // Implementación simplificada de Worley Noise
  return Math.abs(Math.sin(x * 15.2374 + y * 89.123 + t) * Math.cos(x * 23.525 + y * 45.238));
}

// Variable para el generador de números aleatorios con semilla
const random = createSeededRandom(42);