/**
 * @file Tipos base para la entidad File3D.
 * @module types/entities/file3d/base
 * @description Define los tipos canónicos para la entidad File3D, siguiendo el nuevo patrón de `...WithStats`.
 */

/**
 * 🧊 Tipo base de File3D directamente desde el schema de Drizzle.
 */
export type File3DBase = {
	id: string;
	name: string;
	path: string;
	size: number;
	hash: string;
	mimeType: string;
	extension: string;
	folderId: string;
	isFavorite: boolean;
	isArchived: boolean;
	format: string | null;
	version: string | null;
	vertices: number | null;
	faces: number | null;
	triangles: number | null;
	materials: number | null;
	textures: number | null;
	animations: number | null;
	bones: number | null;
	scenes: number | null;
	cameras: number | null;
	lights: number | null;
	hasUV: boolean | null;
	hasNormals: boolean | null;
	hasColors: boolean | null;
	boundingBox: string | null;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * 📊 Métricas y estadísticas calculadas para un archivo 3D.
 * Estas métricas se enfocan en las características técnicas y complejidad del modelo.
 */
export interface File3DStatistics {
	/** Número de polígonos del modelo */
	polygonCount: number;
	/** Tamaño total de las texturas asociadas en MB */
	textureSize: number;
	/** Formato del archivo (por ejemplo, 'glb', 'obj') */
	format: string;
	/** Número de vértices del modelo */
	vertexCount: number;
	/** Número de materiales utilizados en el modelo */
	materialCount: number;

	// File system properties for browser integration
	/** File size in bytes */
	size: number;
	/** Last modification time */
	mtime: Date;
	/** File creation time */
	birthtime: Date;
	/** File type for browser compatibility */
	type: string;
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
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
