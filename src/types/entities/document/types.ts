/**
 * 📄 Tipos canónicos para la entidad Document
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 */

export interface DocumentBase {
  id: string;
  name: string;
  filePath: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentCreateInput = Omit<DocumentBase, 'id' | 'createdAt' | 'updatedAt'>;
export type DocumentUpdateInput = Partial<Omit<DocumentBase, 'id'>>;
