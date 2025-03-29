/**
 * @file Tipos completos para la entidad Image con campos JSON deserializados
 * @module types/entities/image/complete
 */

import type { Album } from '../album';
import type { Character } from '../character';
import type { Collection } from '../collection';
import type { Concept } from '../concept';
import type { FolderExtended } from '../folder/extended';
import type { Group } from '../group';
import type { Note } from '../note';
import type { Place } from '../place';
import type { Prompt } from '../prompt';
import type { Property } from '../property';
import type { Tag } from '../tag';
import type { Wildcard } from '../wildcard';
import type { WorldItem } from '../world-item';
import type { ImageBase, ImageMetadata, ImageStatsBase, ImageVisualConfigBase } from './base';

/**
 * Interfaz para Image con campos JSON deserializados
 * @description Extiende ImageBase pero con los campos JSON ya deserializados como objetos tipados
 */
export interface ImageComplete extends Omit<ImageBase, 'metadata'> {
  /**
   * Metadatos de la imagen deserializados como objeto
   * @description En la base de datos se almacena como string JSON,
   * pero aquí ya está parseado como objeto tipado
   */
  metadata?: ImageMetadata;
}

/**
 * Interfaz para Image con relaciones y campos JSON deserializados
 */
export interface ImageWithRelationsComplete extends ImageComplete {
  // Relaciones cargadas
  folder?: FolderExtended;
  visualConfig?: ImageVisualConfigComplete | null;
  stats?: ImageStatsComplete | null;

  // Relaciones básicas
  uploadedImages?: any[];
  activities?: any[];

  // Relaciones con entidades principales
  tagEntities?: Tag[]; // Renombrado para evitar confusión con posibles campos "tags"
  albumEntities?: Album[];
  collectionEntities?: Collection[];
  characterEntities?: Character[];
  placeEntities?: Place[];
  worldItemEntities?: WorldItem[];
  conceptEntities?: Concept[];
  promptEntities?: Prompt[];
  noteEntities?: Note[];
  wildcardEntities?: Wildcard[];
  propertyEntities?: Property[];
  groupEntities?: Group[];
}

/**
 * Tipo para la configuración visual con campos JSON deserializados
 */
export interface ImageVisualConfigComplete extends Omit<ImageVisualConfigBase, 'layerSystem'> {
  /**
   * Sistema de capas deserializado como objeto
   * @description En la base de datos se almacena como string JSON
   */
  layersConfig?: Record<string, unknown>;
}

/**
 * Tipo para estadísticas con campos JSON deserializados
 */
export interface ImageStatsComplete extends ImageStatsBase {
  // Actualmente no hay campos JSON en ImageStats
  // Este tipo existe para consistencia con el patrón seguido
}

/**
 * Interfaz extendida con propiedades UI para la interacción del usuario
 */
export interface ImageExtendedComplete extends ImageComplete {
  // Propiedades calculadas
  thumbUrl?: string;
  fullUrl?: string;
  displayName?: string;
  isProcessed?: boolean;
  parsedTags?: string[];
  aspectRatio?: number;

  // Propiedades adicionales de UI
  thumbnailUrl?: string;
  selected?: boolean;
  loading?: boolean;
  thumbnailLoading?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isEditing?: boolean;

  // Indicadores de estado
  hasMetadata?: boolean;
  hasThumbnail?: boolean;
  hasError?: boolean;
  isInViewport?: boolean;
}

/**
 * Interfaz para Image con relaciones, campos deserializados y propiedades UI
 */
export interface ImageWithRelationsExtendedComplete
  extends ImageExtendedComplete,
    Omit<ImageWithRelationsComplete, keyof ImageComplete> {
  // Este tipo combina todas las propiedades de los tipos anteriores
}