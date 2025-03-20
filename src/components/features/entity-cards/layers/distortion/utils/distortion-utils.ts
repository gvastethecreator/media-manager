import type { DistortionConfig } from '../actions/distortion-config.action';

interface DistortionEffectOptions extends Partial<DistortionConfig> {
  width: number;
  height: number;
  time?: number;
}

// 🌈 Generar efecto de aberración cromática
function generateChromaticAberration(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: number,
  intensity: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const redOffset = Math.round(x + offset);
      const blueOffset = Math.round(x - offset);

      if (redOffset >= 0 && redOffset < width) {
        const redI = (y * width + redOffset) * 4;
        data[i] = tempData[redI];
      }

      if (blueOffset >= 0 && blueOffset < width) {
        const blueI = (y * width + blueOffset) * 4 + 2;
        data[i + 2] = tempData[blueI];
      }
    }
  }

  // Aplicar intensidad
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * intensity + tempData[i] * (1 - intensity);
    data[i + 2] = data[i + 2] * intensity + tempData[i + 2] * (1 - intensity);
  }

  ctx.putImageData(imageData, 0, 0);
}

// 🎲 Generar efecto glitch
function generateGlitchEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  frequency: number,
  time: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);

  // Generar líneas de glitch
  const numGlitches = Math.round(height * frequency);
  for (let i = 0; i < numGlitches; i++) {
    const y = Math.floor(Math.random() * height);
    const glitchHeight = Math.floor(Math.random() * 10) + 1;
    const offset = Math.round((Math.random() - 0.5) * width * intensity);

    for (let h = 0; h < glitchHeight; h++) {
      if (y + h < height) {
        for (let x = 0; x < width; x++) {
          const sourceX = (x + offset + width) % width;
          const sourceI = ((y + h) * width + sourceX) * 4;
          const targetI = ((y + h) * width + x) * 4;

          data[targetI] = tempData[sourceI];
          data[targetI + 1] = tempData[sourceI + 1];
          data[targetI + 2] = tempData[sourceI + 2];
        }
      }
    }
  }

  // Aplicar ruido y distorsión de color
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < intensity * 0.1) {
      const noise = Math.random() * 255;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
    }

    // Distorsión de color aleatoria
    if (Math.random() < intensity * 0.05) {
      const channel = Math.floor(Math.random() * 3);
      data[i + channel] = Math.random() * 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// 🔲 Generar efecto de pixelado
function generatePixelateEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  blockSize: number,
  intensity: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      // Calcular color promedio del bloque
      let r = 0, g = 0, b = 0, count = 0;

      for (let by = 0; by < blockSize && y + by < height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4;
          r += tempData[i];
          g += tempData[i + 1];
          b += tempData[i + 2];
          count++;
        }
      }

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      // Aplicar color promedio al bloque
      for (let by = 0; by < blockSize && y + by < height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4;
          data[i] = r * intensity + tempData[i] * (1 - intensity);
          data[i + 1] = g * intensity + tempData[i + 1] * (1 - intensity);
          data[i + 2] = b * intensity + tempData[i + 2] * (1 - intensity);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// 🎨 Función principal para generar efectos de distorsión
export function generateDistortionEffects(
  ctx: CanvasRenderingContext2D,
  options: DistortionEffectOptions
): void {
  const {
    width,
    height,
    intensity = 0.5,
    time = 0,
    glitchEffect,
    chromaticAberration,
    pixelate,
  } = options;

  // Guardar estado original
  const originalData = ctx.getImageData(0, 0, width, height);

  // Aplicar efectos en orden
  if (glitchEffect?.enabled) {
    generateGlitchEffect(
      ctx,
      width,
      height,
      glitchEffect.intensity,
      glitchEffect.frequency,
      time
    );
  }

  if (chromaticAberration?.enabled) {
    generateChromaticAberration(
      ctx,
      width,
      height,
      chromaticAberration.offset,
      chromaticAberration.intensity
    );
  }

  if (pixelate?.enabled) {
    generatePixelateEffect(
      ctx,
      width,
      height,
      pixelate.blockSize,
      pixelate.intensity
    );
  }

  // Aplicar intensidad global
  const finalData = ctx.getImageData(0, 0, width, height);
  const data = finalData.data;
  const origData = originalData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * intensity + origData[i] * (1 - intensity);
    data[i + 1] = data[i + 1] * intensity + origData[i + 1] * (1 - intensity);
    data[i + 2] = data[i + 2] * intensity + origData[i + 2] * (1 - intensity);
  }

  ctx.putImageData(finalData, 0, 0);
}