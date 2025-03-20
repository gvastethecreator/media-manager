import type { GlitchConfig, GlitchZone } from '../glitch-schema';

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
 * 🎯 Aplica la zona al efecto glitch
 */
function applyZone(x: number, y: number, zone: GlitchZone): number {
  const { type, size, feather } = zone;
  const position = zone.position || { x: 0.5, y: 0.5 };

  switch (type) {
    case 'horizontal': {
      const distance = Math.abs(y - position.y);
      const featherStart = size - feather;

      if (distance < featherStart) return 1;
      if (distance > size) return 0;

      return 1 - (distance - featherStart) / feather;
    }

    case 'vertical': {
      const distance = Math.abs(x - position.x);
      const featherStart = size - feather;

      if (distance < featherStart) return 1;
      if (distance > size) return 0;

      return 1 - (distance - featherStart) / feather;
    }

    case 'random':
      return Math.random() < size ? 1 : 0;
  }
}

/**
 * 🌈 Aplica el desplazamiento de canales de color
 */
function applyColorChannels(
  imageData: ImageData,
  config: GlitchConfig,
  random: SeededRandom
): void {
  if (!config.colorChannels) return;

  const { width, height } = imageData;
  const tempData = new Uint8ClampedArray(imageData.data);

  const channels = {
    red: { offset: 0, intensity: config.colorChannels.red?.intensity || 0 },
    green: { offset: 1, intensity: config.colorChannels.green?.intensity || 0 },
    blue: { offset: 2, intensity: config.colorChannels.blue?.intensity || 0 },
  };

  for (const [channel, { offset, intensity }] of Object.entries(channels)) {
    if (intensity === 0) continue;

    const channelConfig = config.colorChannels[channel as keyof typeof config.colorChannels];
    if (!channelConfig) continue;

    const xOffset = Math.round(channelConfig.offset.x * width * intensity);
    const yOffset = Math.round(channelConfig.offset.y * height * intensity);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceX = (x + xOffset + width) % width;
        const sourceY = (y + yOffset + height) % height;
        const sourceIndex = (sourceY * width + sourceX) * 4 + offset;
        const targetIndex = (y * width + x) * 4 + offset;

        imageData.data[targetIndex] = tempData[sourceIndex];
      }
    }
  }
}

/**
 * 📺 Aplica efecto de scanlines
 */
function applyScanlines(imageData: ImageData, intensity: number): void {
  const { width, height } = imageData;
  const lineHeight = 2;

  for (let y = 0; y < height; y++) {
    const scanlineIntensity = y % lineHeight === 0 ? 1 - intensity : 1;

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      imageData.data[i] *= scanlineIntensity;
      imageData.data[i + 1] *= scanlineIntensity;
      imageData.data[i + 2] *= scanlineIntensity;
    }
  }
}

/**
 * 🌫️ Aplica ruido al efecto
 */
function applyNoise(imageData: ImageData, intensity: number, random: SeededRandom): void {
  const { width, height } = imageData;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (random.next() - 0.5) * intensity * 255;
    imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise));
    imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + noise));
    imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + noise));
  }
}

/**
 * 🔲 Aplica compresión al efecto
 */
function applyCompression(imageData: ImageData, amount: number): void {
  const { width, height } = imageData;
  const blockSize = Math.max(1, Math.floor(8 * amount));

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;

      // Calcular promedio del bloque
      for (let by = 0; by < blockSize && y + by < height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4;
          r += imageData.data[i];
          g += imageData.data[i + 1];
          b += imageData.data[i + 2];
          a += imageData.data[i + 3];
          count++;
        }
      }

      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      a = Math.floor(a / count);

      // Aplicar promedio al bloque
      for (let by = 0; by < blockSize && y + by < height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4;
          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
          imageData.data[i + 3] = a;
        }
      }
    }
  }
}

/**
 * 🎨 Genera el efecto glitch según la configuración
 */
export function generateGlitch(
  imageData: ImageData,
  config: GlitchConfig,
  time = 0
): ImageData {
  const { width, height } = imageData;
  const result = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  const random = new SeededRandom(config.seed + Math.floor(time));

  // Aplicar efectos según el tipo de glitch
  switch (config.glitchType) {
    case 'digital':
      applyCompression(result, config.compression);
      applyColorChannels(result, config, random);
      applyNoise(result, config.noise, random);
      break;

    case 'analog':
      applyScanlines(result, config.intensity);
      applyColorChannels(result, config, random);
      applyNoise(result, config.noise * 0.5, random);
      break;

    case 'rgb':
      applyColorChannels(result, {
        ...config,
        colorChannels: {
          red: { offset: { x: 0.02, y: 0 }, intensity: config.intensity },
          green: { offset: { x: 0, y: 0 }, intensity: config.intensity },
          blue: { offset: { x: -0.02, y: 0 }, intensity: config.intensity },
        },
      }, random);
      break;

    case 'slice':
      // Implementar cortes aleatorios
      const numSlices = Math.floor(config.intensity * 10);
      for (let i = 0; i < numSlices; i++) {
        const y = Math.floor(random.next() * height);
        const sliceHeight = Math.floor(random.next() * 20 + 5);
        const offset = Math.floor((random.next() - 0.5) * width * 0.1);

        for (let sy = y; sy < Math.min(y + sliceHeight, height); sy++) {
          for (let x = 0; x < width; x++) {
            const sourceX = (x + offset + width) % width;
            const sourceIndex = (sy * width + sourceX) * 4;
            const targetIndex = (sy * width + x) * 4;

            result.data[targetIndex] = imageData.data[sourceIndex];
            result.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
            result.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
          }
        }
      }
      break;

    case 'corruption':
      // Implementar corrupción de datos
      const corruptionAmount = Math.floor(config.intensity * width * height * 0.01);
      for (let i = 0; i < corruptionAmount; i++) {
        const x = Math.floor(random.next() * width);
        const y = Math.floor(random.next() * height);
        const length = Math.floor(random.next() * 20 + 5);
        const value = Math.floor(random.next() * 255);

        for (let j = 0; j < length && x + j < width; j++) {
          const index = (y * width + x + j) * 4;
          result.data[index] = value;
          result.data[index + 1] = value;
          result.data[index + 2] = value;
        }
      }
      break;
  }

  // Aplicar zona si está configurada
  if (config.zone) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const zoneFactor = applyZone(x / width, y / height, config.zone);

        if (zoneFactor < 1) {
          result.data[i] = imageData.data[i] * (1 - zoneFactor) + result.data[i] * zoneFactor;
          result.data[i + 1] = imageData.data[i + 1] * (1 - zoneFactor) + result.data[i + 1] * zoneFactor;
          result.data[i + 2] = imageData.data[i + 2] * (1 - zoneFactor) + result.data[i + 2] * zoneFactor;
        }
      }
    }
  }

  return result;
}