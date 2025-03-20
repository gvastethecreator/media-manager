'use server';

import type { BaseLayerConfig } from '../../types';

export interface TextureConfig extends BaseLayerConfig {
  textureUrl: string;
  opacity: number;
  scale: number;
  rotation: number;
  blendMode: string;
  offsetX: number;
  offsetY: number;
  tileMode: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
}

// 🔍 Obtiene la configuración de textura para una entidad
export async function getTextureConfig(entityId: string): Promise<TextureConfig | null> {
  try {
    // TODO: Implementar la lógica de base de datos
    return null;
  } catch (error) {
    console.error('Error al obtener la configuración de textura:', error);
    return null;
  }
}

// 💾 Actualiza la configuración de textura para una entidad
export async function updateTextureConfig(
  entityId: string,
  config: Partial<TextureConfig>
): Promise<boolean> {
  try {
    // TODO: Implementar la lógica de base de datos
    return true;
  } catch (error) {
    console.error('Error al actualizar la configuración de textura:', error);
    return false;
  }
}

// 🗑️ Elimina la configuración de textura para una entidad
export async function deleteTextureConfig(entityId: string): Promise<boolean> {
  try {
    // TODO: Implementar la lógica de base de datos
    return true;
  } catch (error) {
    console.error('Error al eliminar la configuración de textura:', error);
    return false;
  }
}

// 📦 Tipos de texturas predefinidas
export const TEXTURE_PRESETS = {
  PAPER: {
    name: 'Papel',
    description: 'Textura de papel con relieve sutil',
    url: '/textures/paper.jpg',
  },
  CONCRETE: {
    name: 'Concreto',
    description: 'Textura de concreto con detalles',
    url: '/textures/concrete.jpg',
  },
  FABRIC: {
    name: 'Tela',
    description: 'Textura de tela tejida',
    url: '/textures/fabric.jpg',
  },
  METAL: {
    name: 'Metal',
    description: 'Textura metálica con brillo',
    url: '/textures/metal.jpg',
  },
  WOOD: {
    name: 'Madera',
    description: 'Textura de madera natural',
    url: '/textures/wood.jpg',
  },
} as const;

// 🎨 Modos de fusión disponibles
export const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
] as const;

// 🔁 Modos de mosaico disponibles
export const TILE_MODES = [
  'repeat',
  'repeat-x',
  'repeat-y',
  'no-repeat',
] as const;