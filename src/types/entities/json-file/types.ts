/**
 * 🟫 Tipos canónicos para la entidad JsonFile
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 */

export interface JsonFileBase {
  id: string;
  name: string;
  filePath: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type JsonFileCreateInput = Omit<JsonFileBase, 'id' | 'createdAt' | 'updatedAt'>;
export type JsonFileUpdateInput = Partial<Omit<JsonFileBase, 'id'>>;
