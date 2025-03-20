'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { CardImage } from '../card-image';
import type { LayerComponentProps } from '../layer-plugin-system';

/**
 * 🖼️ Configuración de la capa de imagen
 */
export interface ImageLayerConfig {
  /** Habilitar/deshabilitar la capa */
  enabled: boolean;
  /** Posición en el stack de capas */
  layerIndex: number;
  /** Modo de ajuste de la imagen */
  objectFit: 'cover' | 'contain' | 'fill' | 'none';
  /** Relación de aspecto */
  aspectRatio: '1/1' | '4/3' | '3/4' | '16/9' | 'auto';
  /** Bordes redondeados */
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Nivel de desenfoque (0-10) */
  blur: number;
  /** Nivel de escala de grises (0-100) */
  grayscale: number;
  /** Nivel de brillo (50-150) */
  brightness: number;
  /** Nivel de contraste (50-150) */
  contrast: number;
  /** Nivel de saturación (0-200) */
  saturate: number;
  /** Estrategia de carga */
  loading?: 'eager' | 'lazy';
  /** Tipo de placeholder */
  placeholder?: 'blur' | 'empty' | 'shimmer';
  /** Opciones de accesibilidad */
  accessibility?: {
    /** Texto alternativo */
    alt?: string;
    /** Descripción larga */
    description?: string;
  };
}

// Imagen por defecto para usar cuando no hay URL válida
const DEFAULT_IMAGE = '/placeholders/character-placeholder.jpg';

// Función para validar si la URL de la imagen es válida
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;

  try {
    // Verificar si es una URL externa
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url);
      return true;
    }

    // Verificar si es una URL interna
    if (url.startsWith('/')) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * 🧩 Componente para la capa de imagen
 * Muestra la imagen principal de la entidad con efectos y ajustes configurables
 */
export function ImageLayerComponent({
  entity,
  config,
  cardOptions,
  isHovered,
  isActive,
}: LayerComponentProps<ImageLayerConfig>) {
  // Estados para manejar la carga y errores de imagen
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Resetear estados cuando cambia la URL de la imagen
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
    setHasLoaded(false);
  }, [entity?.imageUrl]);

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

  // Obtener propiedades de accesibilidad
  const getAccessibilityProps = () => ({
    alt: config.accessibility?.alt || entity?.title || entity?.name || 'Imagen',
    'aria-label': config.accessibility?.alt,
    'aria-description': config.accessibility?.description,
    role: 'img',
  });

  return (
    <motion.div
      className={cn(
        'card-image relative overflow-hidden',
        getBorderRadiusClass(),
        config.aspectRatio !== 'auto' && `aspect-[${config.aspectRatio}]`,
        isLoading && !hasLoaded && 'animate-pulse bg-muted',
        isHovered && 'image-hovered',
        isActive && 'image-active'
      )}
      style={{
        zIndex: config.layerIndex,
        filter: getFilterStyle(),
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.05 : 1
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Placeholder mientras carga */}
      {isLoading && !hasLoaded && config.placeholder === 'shimmer' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}

      <CardImage
        options={cardOptions}
        src={imageSrc}
        {...getAccessibilityProps()}
        className={cn(
          'w-full h-full transition-all duration-300',
          config.objectFit === 'cover' && 'object-cover',
          config.objectFit === 'contain' && 'object-contain',
          config.objectFit === 'fill' && 'object-fill',
          config.objectFit === 'none' && 'object-none',
          !hasLoaded && 'opacity-0',
          hasLoaded && 'opacity-100'
        )}
        loading={config.loading || 'lazy'}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        onLoad={() => {
          setIsLoading(false);
          setHasLoaded(true);
        }}
      />
    </motion.div>
  );
}

// Asignar displayName para DevTools
ImageLayerComponent.displayName = 'ImageLayer';