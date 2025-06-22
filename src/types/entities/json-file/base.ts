/**
 * @file Tipos base para la entidad JsonFile.
 * @module types/entities/json-file/base
 * @description Define los tipos canónicos para la entidad JsonFile, siguiendo el nuevo patrón de `...WithStats`.
 */

import type { JsonFile } from '@prisma/client';

/**
 * 🟫 Tipo base de JsonFile directamente desde el schema de Prisma.
 */
export type JsonFileBase = JsonFile;

/**
 * 📊 Métricas y estadísticas calculadas para un archivo JSON.
 * Estas métricas se enfocan en la estructura y validez del contenido JSON.
 */
export interface JsonFileStatistics {
  /** Tamaño del archivo en bytes */
  size: number;
  /** Profundidad máxima de anidamiento del JSON */
  nestingDepth: number;
  /** Indica si el contenido JSON es válido y parseable */
  isValid: boolean;
  /** Número total de claves en el objeto JSON */
  keyCount: number;
}

/**
 * ✨ Tipo enriquecido de JsonFile que incluye estadísticas.
 * Este es el tipo canónico para usar en la aplicación.
 */
export interface JsonFileWithStats extends JsonFileBase {
  stats: JsonFileStatistics;
}