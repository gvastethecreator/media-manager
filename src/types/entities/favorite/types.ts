/**
 * ⭐ Tipos canónicos para la entidad Favorite
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para Favorite.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - FavoriteBase: tipo canónico principal
 * - FavoriteRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - FavoriteCreateInput, FavoriteUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

export type FavoriteBase = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // otros campos base
};

export type FavoriteRelations = {
  // relaciones con otras entidades
};

export type FavoriteCreateInput = Omit<FavoriteBase, 'id' | 'createdAt' | 'updatedAt'>;

export type FavoriteUpdateInput = Partial<Omit<FavoriteBase, 'id'>>;