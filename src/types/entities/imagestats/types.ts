/**
 * 📊 Tipos canónicos para la entidad ImageStats
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 */

export interface ImageStatsBase {
  id: string;
  views: number;
  lastViewed: Date;
  imageId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ImageStatsCreateInput = Omit<ImageStatsBase, 'id' | 'createdAt' | 'updatedAt'>;
export type ImageStatsUpdateInput = Partial<Omit<ImageStatsBase, 'id'>>;
