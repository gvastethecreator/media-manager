/**
 * @file Tipos base para la entidad File3D.
 * @module types/entities/file3d/base
 * @description Define los tipos canónicos para la entidad File3D, siguiendo el nuevo patrón de `...WithStats`.
 */

/**
 * 🧊 Tipo base de File3D directamente desde el schema de Drizzle.
 */
export interface File3DBase {
	animations: number | null;
	bones: number | null;
	boundingBox: string | null;
	cameras: number | null;
	createdAt: Date;
	extension: string;
	faces: number | null;
	folderId: string;
	format: string | null;
	hasColors: boolean | null;
	hash: string;
	hasNormals: boolean | null;
	hasUV: boolean | null;
	id: string;
	isArchived: boolean;
	isFavorite: boolean;
	lights: number | null;
	materials: number | null;
	mimeType: string;
	name: string;
	path: string;
	scenes: number | null;
	size: number;
	textures: number | null;
	triangles: number | null;
	updatedAt: Date;
	version: string | null;
	vertices: number | null;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Métricas y estadísticas calculadas para un archivo 3D.
 * Estas métricas se enfocan en las características técnicas y complejidad del modelo.
 */
export interface File3DStatistics extends EntityStats {
	/** Formato del archivo (por ejemplo, 'glb', 'obj') */
	format: string;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	/** Número de materiales utilizados en el modelo */
	materialCount: number;
	/** Número de polígonos del modelo */
	polygonCount: number;
	/** Tamaño total de las texturas asociadas en MB */
	textureSize: number;
	/** Número de vértices del modelo */
	vertexCount: number;
}

/**
 * ✨ Tipo enriquecido de File3D que incluye estadísticas.
 * Este es el tipo canónico para usar en la aplicación.
 */
export interface File3DWithStats extends File3DBase {
	stats: File3DStatistics;
}

// --- TIPOS PARA MUTACIONES ---

/**
 * 🆕 Tipo para crear un nuevo File3D
 * Omite campos autogenerados (id, timestamps)
 */
export type File3DCreateInput = Omit<File3DBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * ✏️ Tipo para actualizar un File3D existente
 * Todos los campos son opcionales excepto id
 */
export type File3DUpdateInput = Partial<File3DCreateInput>;
