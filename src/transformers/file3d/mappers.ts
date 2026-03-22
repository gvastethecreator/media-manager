// Mappers para File3D

import type { File3DBase } from '@/types/entities/file3d';

// Tipo local equivalente a Drizzle
interface DrizzleFile3D {
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

/**
 * Convierte un objeto File3D de Drizzle al tipo de la aplicación
 * ✅ MIGRADO A DRIZZLE
 */
export function fromDrizzleFile3D(drizzle: DrizzleFile3D): File3DBase {
	return {
		id: drizzle.id,
		name: drizzle.name,
		path: drizzle.path,
		size: drizzle.size,
		hash: drizzle.hash,
		mimeType: drizzle.mimeType,
		extension: drizzle.extension,
		folderId: drizzle.folderId,
		isFavorite: drizzle.isFavorite,
		isArchived: drizzle.isArchived,
		format: drizzle.format,
		version: drizzle.version,
		vertices: drizzle.vertices,
		faces: drizzle.faces,
		triangles: drizzle.triangles,
		materials: drizzle.materials,
		textures: drizzle.textures,
		animations: drizzle.animations,
		bones: drizzle.bones,
		scenes: drizzle.scenes,
		cameras: drizzle.cameras,
		lights: drizzle.lights,
		hasUV: drizzle.hasUV,
		hasNormals: drizzle.hasNormals,
		hasColors: drizzle.hasColors,
		boundingBox: drizzle.boundingBox,
		createdAt: drizzle.createdAt,
		updatedAt: drizzle.updatedAt,
	};
}

/**
 * Convierte un objeto File3D de la aplicación al tipo de Drizzle
 * ✅ MIGRADO A DRIZZLE
 */
export function toDrizzleFile3D(file: File3DBase): DrizzleFile3D {
	return {
		id: file.id,
		name: file.name,
		path: file.path,
		size: file.size,
		hash: file.hash,
		mimeType: file.mimeType,
		extension: file.extension,
		folderId: file.folderId,
		isFavorite: file.isFavorite,
		isArchived: file.isArchived,
		format: file.format,
		version: file.version,
		vertices: file.vertices,
		faces: file.faces,
		triangles: file.triangles,
		materials: file.materials,
		textures: file.textures,
		animations: file.animations,
		bones: file.bones,
		scenes: file.scenes,
		cameras: file.cameras,
		lights: file.lights,
		hasUV: file.hasUV,
		hasNormals: file.hasNormals,
		hasColors: file.hasColors,
		boundingBox: file.boundingBox,
		createdAt: file.createdAt,
		updatedAt: file.updatedAt,
	};
}
