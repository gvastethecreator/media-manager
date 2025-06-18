/**
 * 🖼️ Tipos canónicos para la entidad Thumbnail
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para Thumbnail.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - ThumbnailBase: tipo canónico principal
 * - ThumbnailRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - ThumbnailCreateInput, ThumbnailUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

export type ThumbnailBase = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // otros campos base
};

export type ThumbnailRelations = {
  // relaciones con otras entidades
};

export type ThumbnailCreateInput = Omit<ThumbnailBase, 'id' | 'createdAt' | 'updatedAt'>;
export type ThumbnailUpdateInput = Partial<Omit<ThumbnailBase, 'id'>>;

// ...existing code...