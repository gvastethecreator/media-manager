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

/**
 * 🎵 Audio con todas sus relaciones y metadatos adicionales
 */
export interface AudioComplete extends AudioBase {
	metadata?: Record<string, unknown>;
	tags?: Array<{ id: string; name: string }>;
	_count?: {
		tags: number;
	};
}

export type AudioCreateInput = Omit<AudioBase, 'id' | 'createdAt' | 'updatedAt'>;
export type AudioUpdateInput = Partial<Omit<AudioBase, 'id'>>;
