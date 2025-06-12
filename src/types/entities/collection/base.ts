/**
 * @file Tipos base para la entidad Collection derivados directamente de Prisma
 * @module types/entities/collection/base
 */

/**
 * 📚 Tipo base para Collection, solo campos canónicos y serializables
 */
export interface CollectionBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	category?: string;
	imageCount?: number;
	filters?: string;
	sortBy?: string;
	editions?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * Resumen básico de una colección para listados
 */
export interface CollectionSummary {
	id: string;
	name: string;
	emoji: string;
	color: string;
	imageCount: number;
	category?: string;
}

/**
 * Representación completa de la colección con campos JSON deserializados
 */
export interface CollectionComplete {
	id: string;
	name: string;
	emoji: string;
	color: string;
	category?: string;
	imageCount?: number;
	filters: any[];
	sortBy: any;
	editions: any[];
	createdAt?: Date;
	updatedAt?: Date;
}

// ✅ CollectionBase ahora es seguro y serializable para frontend/backend.
