import type { Album } from '../albums';
import type { Character } from '../characters';
import type { Collection } from '../collections';
import type { Concept } from '../concepts';
import type { FolderExtended } from '../folder/extended';
import type { Place } from '../places';
import type { Tag } from '../tag';
import type { WorldItem } from '../world-items';
import type {
    ImageBase,
    ImageMetadata,
    ImageStatsBase,
    ImageVisualConfigBase
} from './base';

/**
 * Tipo extendido para Image con relaciones y propiedades de UI
 */
export interface ImageExtended extends ImageBase {
  // Relaciones cargadas
  folder?: FolderExtended;
  visualConfig?: ImageVisualConfigExtended | null;
  stats?: ImageStatsExtended | null;
  tags?: Tag[];
  albums?: Album[];
  collections?: Collection[];
  characters?: Character[];
  places?: Place[];
  worldItems?: WorldItem[];
  concepts?: Concept[];

  // Propiedades adicionales de UI
  metadata?: ImageMetadata;
  thumbnailUrl?: string;
  fullUrl?: string;
  selected?: boolean;
  loading?: boolean;
  thumbnailLoading?: boolean;
  isExpanded?: boolean;
  aspectRatio?: number;

  // Indicadores de estado
  hasMetadata?: boolean;
  hasThumbnail?: boolean;
  hasError?: boolean;
  isInViewport?: boolean;
}

/**
 * Tipo extendido para ImageVisualConfig con propiedades de UI
 */
export interface ImageVisualConfigExtended extends ImageVisualConfigBase {
  // Propiedades de UI para la visualización
  effectsEnabled?: boolean;
  layersConfig?: Record<string, unknown>;
  viewerOptions?: ImageViewerOptions;
}

/**
 * Opciones para el visor de imágenes
 */
export interface ImageViewerOptions {
  zoomFactor?: number;
  rotationAngle?: number;
  enableFullscreen?: boolean;
  enableTransitions?: boolean;
  slideShowInterval?: number;
  initialFilter?: string;
  initialEffect?: string;
}

/**
 * Tipo extendido para ImageStats con métricas adicionales
 */
export interface ImageStatsExtended extends ImageStatsBase {
  // Métricas adicionales
  totalTagsCount?: number;
  totalAlbumsCount?: number;
  totalCollectionsCount?: number;
  averageTimeViewed?: number;
  popularityScore?: number;
  recentActivity?: {
    lastViewDate?: Date;
    viewsLast7Days?: number;
    viewsLast30Days?: number;
  };
}