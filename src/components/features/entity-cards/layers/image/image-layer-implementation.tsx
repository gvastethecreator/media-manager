'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useState } from 'react';
import { CardImage } from '../card-image';
import type { LayerComponentProps } from '../layer-plugin-system';

/**
 * Props para el componente ImageLayerComponent
 */
export interface ImageLayerConfig {
  enabled: boolean;
  layerIndex: number;
  objectFit: 'cover' | 'contain' | 'fill' | 'none';
  aspectRatio: '1/1' | '4/3' | '3/4' | '16/9' | 'auto';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  blur: number;
  grayscale: number;
  brightness: number;
  contrast: number;
  saturate: number;
}

// Imagen por defecto para usar cuando no hay URL válida
const DEFAULT_IMAGE = '/placeholders/character-placeholder.jpg';

// Función para validar si la URL de la imagen es válida
function isValidImageUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;

  // Verificar si es una URL externa
  if (url.startsWith('http://') || url.startsWith('https://')) return true;

  // Verificar si es una URL interna
  if (url.startsWith('/')) return true;

  return false;
}

/**
 * Componente para la capa de imagen
 * Muestra la imagen principal de la entidad con efectos y ajustes configurables
 */
export function ImageLayerComponent({
  entity,
  config,
  cardOptions,
}: LayerComponentProps<ImageLayerConfig>) {
  // Estado para manejar errores de carga de imagen
  const [imageError, setImageError] = useState(false);

  if (!config.enabled) {
    return null;
  }

  // Obtener la URL de la imagen de la entidad o usar la predeterminada
  const imageUrl = entity?.imageUrl || entity?.thumbnailUrl || entity?.image || DEFAULT_IMAGE;
  const imageSrc = imageError || !isValidImageUrl(imageUrl) ? DEFAULT_IMAGE : imageUrl;

  // Determinar las clases de tailwind basadas en la configuración
  const getBorderRadiusClass = () => {
    switch (config.borderRadius) {
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'full': return 'rounded-full';
      default: return '';
    }
  };

  // Generar filtros CSS
  const getFilterStyle = () => {
    const filters = [];
    if (config.blur > 0) filters.push(`blur(${config.blur}px)`);
    if (config.grayscale > 0) filters.push(`grayscale(${config.grayscale}%)`);
    if (config.brightness !== 100) filters.push(`brightness(${config.brightness}%)`);
    if (config.contrast !== 100) filters.push(`contrast(${config.contrast}%)`);
    if (config.saturate !== 100) filters.push(`saturate(${config.saturate}%)`);

    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  return (
    <motion.div
      className={cn(
        'card-image relative overflow-hidden',
        getBorderRadiusClass(),
        config.aspectRatio !== 'auto' && `aspect-[${config.aspectRatio}]`
      )}
      style={{
        zIndex: config.layerIndex,
        filter: getFilterStyle(),
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CardImage
        options={cardOptions}
        src={imageSrc}
        alt={entity?.title || entity?.name || 'Imagen'}
        className={cn(
          'w-full h-full',
          config.objectFit === 'cover' && 'object-cover',
          config.objectFit === 'contain' && 'object-contain',
          config.objectFit === 'fill' && 'object-fill',
          config.objectFit === 'none' && 'object-none'
        )}
        onError={() => setImageError(true)}
      />
    </motion.div>
  );
}