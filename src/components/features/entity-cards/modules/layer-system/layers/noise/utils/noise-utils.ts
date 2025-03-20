import { NoiseConfig, NoiseZone } from '../noise-schema';

/**
 * 🎲 Generador de números aleatorios con semilla
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

/**
 * 🌊 Genera ruido Perlin
 */
function generatePerlinNoise(x: number, y: number, seed: number): number {
  const random = new SeededRandom(seed);
  const p = new Array(512);

  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }

  for (let i = 0; i < 256; i++) {
    const j = Math.floor(random.next() * (256 - i)) + i;
    [p[i], p[j]] = [p[j], p[i]];
    p[i + 256] = p[i];
  }

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const A = p[X] + Y;
  const B = p[X + 1] + Y;

  return lerp(v,
    lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
    lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
  ) * 0.5 + 0.5;
}

/**
 * 🌀 Genera ruido Simplex
 */
function generateSimplexNoise(x: number, y: number, seed: number): number {
  const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  const random = new SeededRandom(seed);
  const p = new Array(512);

  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }

  for (let i = 0; i < 256; i++) {
    const j = Math.floor(random.next() * (256 - i)) + i;
    [p[i], p[j]] = [p[j], p[i]];
    p[i + 256] = p[i];
  }

  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;

  const n0 = Math.max(0.0, 0.5 - x0 * x0 - y0 * y0) ** 4 * grad(p[i + p[j]], x0, y0);
  const n1 = Math.max(0.0, 0.5 - x1 * x1 - y1 * y1) ** 4 * grad(p[i + i1 + p[j + j1]], x1, y1);
  const n2 = Math.max(0.0, 0.5 - x2 * x2 - y2 * y2) ** 4 * grad(p[i + 1 + p[j + 1]], x2, y2);

  return (70.0 * (n0 + n1 + n2) + 1) * 0.5;
}

/**
 * 🎯 Genera ruido de valor
 */
function generateValueNoise(x: number, y: number, seed: number): number {
  const random = new SeededRandom(seed);
  const p = new Array(256);

  for (let i = 0; i < 256; i++) {
    p[i] = random.next();
  }

  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const v00 = p[(xi + p[yi & 255]) & 255];
  const v10 = p[(xi + 1 + p[yi & 255]) & 255];
  const v01 = p[(xi + p[(yi + 1) & 255]) & 255];
  const v11 = p[(xi + 1 + p[(yi + 1) & 255]) & 255];

  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);

  return lerp(sy,
    lerp(sx, v00, v10),
    lerp(sx, v01, v11)
  );
}

/**
 * 🔲 Genera ruido Worley (celular)
 */
function generateWorleyNoise(x: number, y: number, seed: number): number {
  const random = new SeededRandom(seed);
  const points: [number, number][] = [];
  const cellSize = 1;
  const numPoints = 5;

  for (let i = 0; i < numPoints; i++) {
    points.push([random.next(), random.next()]);
  }

  const xi = Math.floor(x / cellSize);
  const yi = Math.floor(y / cellSize);
  let minDist = Infinity;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const cellX = xi + i;
      const cellY = yi + j;
      const random = new SeededRandom(seed + cellX * 1000 + cellY);

      for (let k = 0; k < numPoints; k++) {
        const px = cellX + random.next();
        const py = cellY + random.next();
        const dx = x - px * cellSize;
        const dy = y - py * cellSize;
        const dist = Math.sqrt(dx * dx + dy * dy);
        minDist = Math.min(minDist, dist);
      }
    }
  }

  return minDist;
}

/**
 * 🌳 Genera ruido fractal (FBM)
 */
function generateFractalNoise(
  x: number,
  y: number,
  seed: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
  noiseFunc: (x: number, y: number, seed: number) => number
): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noiseFunc(x * frequency, y * frequency, seed + i) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

/**
 * 🎨 Aplica el modo de color al ruido
 */
function applyColorMode(value: number, colorMode: NoiseConfig['colorMode']): [number, number, number] {
  switch (colorMode) {
    case 'monochrome':
      return [value, value, value];
    case 'rgb':
      return [
        (Math.sin(value * Math.PI * 2) + 1) * 0.5,
        (Math.sin(value * Math.PI * 2 + Math.PI * 2/3) + 1) * 0.5,
        (Math.sin(value * Math.PI * 2 + Math.PI * 4/3) + 1) * 0.5
      ];
    case 'hsl':
      const h = value * 360;
      const s = 0.7;
      const l = 0.5;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c/2;
      let r = 0, g = 0, b = 0;

      if (h < 60) { r = c; g = x; b = 0; }
      else if (h < 120) { r = x; g = c; b = 0; }
      else if (h < 180) { r = 0; g = c; b = x; }
      else if (h < 240) { r = 0; g = x; b = c; }
      else if (h < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }

      return [r + m, g + m, b + m];
  }
}

/**
 * 🎯 Aplica la zona al ruido
 */
function applyZone(x: number, y: number, zone: NoiseZone): number {
  if (!zone) return 1;

  switch (zone.type) {
    case 'circle': {
      if (!zone.center || !zone.radius) return 1;
      const dx = x - zone.center.x;
      const dy = y - zone.center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const featherStart = zone.radius - zone.feather;

      if (distance < featherStart) return 1;
      if (distance > zone.radius) return 0;

      return 1 - (distance - featherStart) / zone.feather;
    }

    case 'rectangle': {
      if (!zone.position || !zone.size) return 1;
      const { position, size, feather } = zone;
      const left = position.x;
      const top = position.y;
      const right = left + size.width;
      const bottom = top + size.height;

      if (x < left || x > right || y < top || y > bottom) return 0;

      const dx = Math.min(x - left, right - x) / feather;
      const dy = Math.min(y - top, bottom - y) / feather;
      const edge = Math.min(dx, dy);

      return Math.min(1, edge);
    }
  }
}

/**
 * 🎨 Genera el ruido según la configuración
 */
export function generateNoise(
  imageData: ImageData,
  config: NoiseConfig,
  time: number = 0
): ImageData {
  const { width, height } = imageData;
  const result = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  const { noiseType, scale, intensity, colorMode, seed, zone, fractalConfig, animated, animationSpeed } = config;

  const noiseFunction = (x: number, y: number, seed: number): number => {
    const animOffset = animated ? time * animationSpeed : 0;
    const nx = x / scale + animOffset;
    const ny = y / scale;

    let value: number;
    switch (noiseType) {
      case 'perlin':
        value = generatePerlinNoise(nx, ny, seed);
        break;
      case 'simplex':
        value = generateSimplexNoise(nx, ny, seed);
        break;
      case 'value':
        value = generateValueNoise(nx, ny, seed);
        break;
      case 'worley':
        value = generateWorleyNoise(nx, ny, seed);
        break;
      case 'fractal':
        if (!fractalConfig) return generatePerlinNoise(nx, ny, seed);
        value = generateFractalNoise(
          nx, ny, seed,
          fractalConfig.octaves,
          fractalConfig.persistence,
          fractalConfig.lacunarity,
          generatePerlinNoise
        );
        break;
      default:
        value = generatePerlinNoise(nx, ny, seed);
    }

    return value;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const nx = x / width;
      const ny = y / height;

      const zoneFactor = zone ? applyZone(nx, ny, zone) : 1;
      if (zoneFactor === 0) continue;

      const noiseValue = noiseFunction(x, y, seed);
      const [r, g, b] = applyColorMode(noiseValue, colorMode);

      const blend = intensity * zoneFactor;
      result.data[i] = Math.round(imageData.data[i] * (1 - blend) + r * 255 * blend);
      result.data[i + 1] = Math.round(imageData.data[i + 1] * (1 - blend) + g * 255 * blend);
      result.data[i + 2] = Math.round(imageData.data[i + 2] * (1 - blend) + b * 255 * blend);
    }
  }

  return result;
}

// Funciones auxiliares
function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}