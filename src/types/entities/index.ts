// Archivo para re-exportar tipos de entidades

// Re-exportación de tipos desde Prisma
export type { Note, Prompt } from '@prisma/client';

// Interfaces personalizadas para tags tipados
export interface TaggedEntity {
	tags?: string[];
}
