import type { PixelateConfig } from '../actions/pixelate-config.action';

// Función para aplicar el efecto de pixelado a un canvas
export function applyPixelateEffect(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  config: PixelateConfig
): void {
  const sourceCtx = sourceCanvas.getContext('2d');
  const targetCtx = targetCanvas.getContext('2d');

  if (!sourceCtx || !targetCtx) return;

  const { width, height } = sourceCanvas;
  targetCanvas.width = width;
  targetCanvas.height = height;

  // Obtener datos de la imagen original
  const imageData = sourceCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Crear buffer temporal para los píxeles procesados
  const tempImageData = new ImageData(width, height);
  const tempData = tempImageData.data;

  // Aplicar efectos según la configuración
  if (config.colorQuantization) {
    applyColorQuantization(data, config.colorLevels);
  }

  if (config.edgeDetection) {
    applyEdgeDetection(data, width, height, config);
  }

  // Aplicar pixelado
  const pixelSize = Math.max(1, config.pixelSize);
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      const pixelColor = getAverageColor(data, x, y, pixelSize, width, height);
      fillPixelBlock(tempData, x, y, pixelSize, width, height, pixelColor);
    }
  }

  // Aplicar ruido si está configurado
  if (config.noiseAmount > 0) {
    applyNoise(tempData, config.noiseAmount);
  }

  // Aplicar glitch si está configurado
  if (config.glitchIntensity > 0) {
    applyGlitch(tempData, width, height, config);
  }

  // Dibujar el resultado en el canvas de destino
  targetCtx.putImageData(tempImageData, 0, 0);
}

// Función para obtener el color promedio de un bloque de píxeles
function getAverageColor(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  size: number,
  width: number,
  height: number
): [number, number, number, number] {
  let r = 0, g = 0, b = 0, a = 0, count = 0;

  for (let py = y; py < Math.min(y + size, height); py++) {
    for (let px = x; px < Math.min(x + size, width); px++) {
      const i = (py * width + px) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      a += data[i + 3];
      count++;
    }
  }

  return [
    Math.round(r / count),
    Math.round(g / count),
    Math.round(b / count),
    Math.round(a / count),
  ];
}

// Función para rellenar un bloque de píxeles con un color
function fillPixelBlock(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  size: number,
  width: number,
  height: number,
  color: [number, number, number, number]
): void {
  for (let py = y; py < Math.min(y + size, height); py++) {
    for (let px = x; px < Math.min(x + size, width); px++) {
      const i = (py * width + px) * 4;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = color[3];
    }
  }
}

// Función para aplicar cuantización de color
function applyColorQuantization(data: Uint8ClampedArray, levels: number): void {
  const factor = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i] / factor) * factor);
    data[i + 1] = Math.round(Math.round(data[i + 1] / factor) * factor);
    data[i + 2] = Math.round(Math.round(data[i + 2] / factor) * factor);
  }
}

// Función para aplicar detección de bordes
function applyEdgeDetection(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  config: PixelateConfig
): void {
  const tempData = new Uint8ClampedArray(data);
  const kernel = [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;

      // Aplicar kernel de convolución
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const weight = kernel[ky + 1][kx + 1];
          r += tempData[idx] * weight;
          g += tempData[idx + 1] * weight;
          b += tempData[idx + 2] * weight;
        }
      }

      // Aplicar umbral y color de borde
      const idx = (y * width + x) * 4;
      const edge = (Math.abs(r) + Math.abs(g) + Math.abs(b)) / 3 > config.threshold * 255;
      if (edge) {
        data[idx] = config.edgeColor[0];
        data[idx + 1] = config.edgeColor[1];
        data[idx + 2] = config.edgeColor[2];
      }
    }
  }
}

// Función para aplicar ruido
function applyNoise(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < amount) {
      const noise = (Math.random() - 0.5) * 50;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
  }
}

// Función para aplicar efecto glitch
function applyGlitch(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  config: PixelateConfig
): void {
  const numGlitches = Math.floor(config.glitchIntensity * 10);
  const tempData = new Uint8ClampedArray(data);

  for (let i = 0; i < numGlitches; i++) {
    const y = Math.floor(Math.random() * height);
    const glitchWidth = Math.floor(Math.random() * width * 0.3);
    const offset = Math.floor((Math.random() - 0.5) * 20);

    for (let x = 0; x < width; x++) {
      const sourceX = (x + offset + width) % width;
      const sourceIdx = (y * width + sourceX) * 4;
      const targetIdx = (y * width + x) * 4;

      if (x < glitchWidth) {
        data[targetIdx] = tempData[sourceIdx];
        data[targetIdx + 1] = tempData[sourceIdx + 1];
        data[targetIdx + 2] = tempData[sourceIdx + 2];
      }
    }
  }
}

// Función para generar patrones de animación
export function generateAnimationPattern(
  width: number,
  height: number,
  pattern: PixelateConfig['animationPattern'],
  time: number
): number[][] {
  const pixelSizes = Array(height).fill(0).map(() => Array(width).fill(0));

  switch (pattern) {
    case 'wave':
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          pixelSizes[y][x] = Math.sin((x + y) * 0.1 + time) * 4 + 8;
        }
      }
      break;

    case 'spiral':
      const centerX = width / 2;
      const centerY = height / 2;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const angle = Math.atan2(dy, dx);
          const distance = Math.sqrt(dx * dx + dy * dy);
          pixelSizes[y][x] = Math.sin(distance * 0.1 - angle + time) * 4 + 8;
        }
      }
      break;

    case 'random':
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          pixelSizes[y][x] = Math.random() * 8 + 4;
        }
      }
      break;

    default:
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          pixelSizes[y][x] = 8;
        }
      }
  }

  return pixelSizes;
}