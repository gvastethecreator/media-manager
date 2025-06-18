/**
 * 🎵 Tipos canónicos para la entidad Audio
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 */

export interface AudioBase {
  id: string;
  name: string;
  filePath: string;
  format: string;
  duration?: number | null;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AudioCreateInput = Omit<AudioBase, 'id' | 'createdAt' | 'updatedAt'>;
export type AudioUpdateInput = Partial<Omit<AudioBase, 'id'>>;
