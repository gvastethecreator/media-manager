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

export type MetadataBase = {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	format: string;
	width: number;
	height: number;
	size: number;
	colorSpace: string | null;
	hasAlpha: boolean;
	// otros campos base
};

export type MetadataRelations = {
	image: { id: string; path: string } | null;
	// relaciones con otras entidades
	// si no existen tipos canónicos, usar any[]
};

export type MetadataCreateInput = Omit<MetadataBase, 'id' | 'createdAt' | 'updatedAt'>;

export type MetadataUpdateInput = Partial<MetadataBase>;
