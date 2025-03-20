import type { GlitchConfig } from '../actions/glitch-config.action';

interface GlitchEffectOptions extends Partial<GlitchConfig> {
  width: number;
  height: number;
  time?: number;
}

// Función principal para generar el efecto glitch
export function generateGlitchEffect(
  ctx: CanvasRenderingContext2D,
  options: GlitchEffectOptions
): void {
  const {
    width,
    height,
    intensity = 0.5,
    frequency = 2,
    colorShift = true,
    colorShiftAmount = 0.3,
    scanlines = true,
    scanlinesCount = 50,
    scanlinesOpacity = 0.3,
    noise = true,
    noiseIntensity = 0.2,
    distortion = true,
    distortionAmount = 0.3,
    chromatic = true,
    chromaticOffset = 2,
    time = 0,
  } = options;

  // Crear capas separadas para cada efecto
  const layers = {
    base: ctx.getImageData(0, 0, width, height),
    red: ctx.getImageData(0, 0, width, height),
    green: ctx.getImageData(0, 0, width, height),
    blue: ctx.getImageData(0, 0, width, height),
  };

  // Aplicar efectos en orden
  if (distortion) {
    applyDistortion(layers, width, height, distortionAmount, time);
  }

  if (colorShift) {
    applyColorShift(layers, width, height, colorShiftAmount, time);
  }

  if (chromatic) {
    applyChromaticAberration(layers, width, height, chromaticOffset, time);
  }

  if (noise) {
    applyNoise(layers, width, height, noiseIntensity, time);
  }

  // Combinar capas
  const finalImage = combineLayers(layers, width, height);

  // Aplicar scanlines
  if (scanlines) {
    applyScanlines(finalImage, width, height, scanlinesCount, scanlinesOpacity);
  }

  // Aplicar intensidad global
  applyIntensity(finalImage, intensity);

  // Renderizar resultado final
  ctx.putImageData(finalImage, 0, 0);
}

// Aplicar distorsión geométrica
function applyDistortion(
  layers: Record<string, ImageData>,
  width: number,
  height: number,
  amount: number,
  time: number
): void {
  const distortionMap = generateDistortionMap(width, height, time);

  Object.values(layers).forEach(layer => {
    const data = layer.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const offset = Math.floor(distortionMap[y * width + x] * amount * 10);

        if (offset !== 0) {
          const sourceI = i + offset * 4;
          if (sourceI >= 0 && sourceI < data.length - 3) {
            data[i] = data[sourceI];
            data[i + 1] = data[sourceI + 1];
            data[i + 2] = data[sourceI + 2];
          }
        }
      }
    }
  });
}

// Aplicar desplazamiento de color
function applyColorShift(
  layers: Record<string, ImageData>,
  width: number,
  height: number,
  amount: number,
  time: number
): void {
  const shift = Math.sin(time * 2) * amount * 10;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const shiftedX = Math.min(Math.max(x + shift, 0), width - 1);
      const shiftedI = (y * width + Math.floor(shiftedX)) * 4;

      layers.red.data[i] = layers.base.data[shiftedI];
      layers.blue.data[i + 2] = layers.base.data[shiftedI + 2];
    }
  }
}

// Aplicar aberración cromática
function applyChromaticAberration(
  layers: Record<string, ImageData>,
  width: number,
  height: number,
  offset: number,
  time: number
): void {
  const redOffset = Math.sin(time) * offset;
  const blueOffset = Math.cos(time) * offset;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const redX = Math.min(Math.max(x + redOffset, 0), width - 1);
      const blueX = Math.min(Math.max(x + blueOffset, 0), width - 1);

      const redI = (y * width + Math.floor(redX)) * 4;
      const blueI = (y * width + Math.floor(blueX)) * 4;

      layers.red.data[i] = layers.base.data[redI];
      layers.blue.data[i + 2] = layers.base.data[blueI + 2];
    }
  }
}

// Aplicar ruido
function applyNoise(
  layers: Record<string, ImageData>,
  width: number,
  height: number,
  intensity: number,
  time: number
): void {
  Object.values(layers).forEach(layer => {
    const data = layer.data;
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < intensity) {
        const noise = Math.random() * 255;
        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise;
      }
    }
  });
}

// Aplicar scanlines
function applyScanlines(
  imageData: ImageData,
  width: number,
  height: number,
  count: number,
  opacity: number
): void {
  const data = imageData.data;
  const lineHeight = height / count;

  for (let y = 0; y < height; y++) {
    const lineY = y % lineHeight;
    const lineOpacity = (lineY / lineHeight) * opacity;

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] *= 1 - lineOpacity;
      data[i + 1] *= 1 - lineOpacity;
      data[i + 2] *= 1 - lineOpacity;
    }
  }
}

// Aplicar intensidad global
function applyIntensity(imageData: ImageData, intensity: number): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * intensity;
    data[i + 1] = data[i + 1] * intensity;
    data[i + 2] = data[i + 2] * intensity;
  }
}

// Generar mapa de distorsión
function generateDistortionMap(width: number, height: number, time: number): Float32Array {
  const map = new Float32Array(width * height);
  const frequency = 0.02;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = Math.sin(x * frequency + time) * Math.cos(y * frequency + time);
      map[y * width + x] = value;
    }
  }

  return map;
}

// Combinar capas
function combineLayers(
  layers: Record<string, ImageData>,
  width: number,
  height: number
): ImageData {
  const result = new ImageData(width, height);

  for (let i = 0; i < result.data.length; i += 4) {
    result.data[i] = layers.red.data[i];
    result.data[i + 1] = layers.green.data[i + 1];
    result.data[i + 2] = layers.blue.data[i + 2];
    result.data[i + 3] = 255;
  }

  return result;
}