/**
 * 📁 Tipos canónicos para la entidad File
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para File.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - FileBase: tipo canónico principal
 * - FileRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - FileCreateInput, FileUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

export type FileBase = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // otros campos base
};

export type FileRelations = {
  // relaciones con otras entidades
};

export type FileCreateInput = Omit<FileBase, 'id' | 'createdAt' | 'updatedAt'>;

export type FileUpdateInput = Partial<Omit<FileBase, 'id'>>;