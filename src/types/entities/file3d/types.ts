/**
 * 🗂️ Tipos canónicos para la entidad File3D
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 */

export interface File3DBase {
  id: string;
  name: string;
  filePath: string;
  format: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export type File3DCreateInput = Omit<File3DBase, 'id' | 'createdAt' | 'updatedAt'>;
export type File3DUpdateInput = Partial<Omit<File3DBase, 'id'>>;
