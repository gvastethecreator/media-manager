/**
 * 🏷️ Tipos canónicos para la entidad Metadata
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para Metadata.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - MetadataBase: tipo canónico principal
 * - MetadataRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - MetadataCreateInput, MetadataUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

export interface MetadataBase {
	id: string;
	entityType: string;
	entityId: string;
	key: string;
	value: string | null;
	type: string | null;

	category: string | null;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export type MetadataCreateInput = Omit<MetadataBase, 'id' | 'createdAt' | 'updatedAt'>;

export type MetadataUpdateInput = Partial<MetadataBase>;
