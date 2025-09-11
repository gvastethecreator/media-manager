/**
 * @file Extractor de metadata para archivos 3D
 * @module services/file-entity-mapper/metadata/file3d-metadata
 */

import { eq } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import { db } from '@/lib/drizzle';
import { file3Ds } from '@/lib/drizzle/schema';

/**
 * Servicio especializado en la extracción de metadata de archivos 3D
 */
export class File3DMetadataExtractor {
	private static instance: File3DMetadataExtractor;

	private constructor() {}

	public static getInstance(): File3DMetadataExtractor {
		if (!File3DMetadataExtractor.instance) {
			File3DMetadataExtractor.instance = new File3DMetadataExtractor();
		}
		return File3DMetadataExtractor.instance;
	}

	/**
	 * Extrae metadata de un archivo 3D y actualiza la entidad en la base de datos
	 */
	public async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const metadata = await this.extractFile3DMetadata(filePath);

			// Actualizar la entidad en la base de datos
			await db
				.update(file3Ds)
				.set({
					format: metadata.format,
					version: metadata.version,
					vertices: metadata.vertices,
					faces: metadata.faces,
					triangles: metadata.triangles,
					materials: metadata.materials,
					textures: metadata.textures,
					animations: metadata.animations,
					bones: metadata.bones,
					scenes: metadata.scenes,
					cameras: metadata.cameras,
					lights: metadata.lights,
					hasUV: metadata.hasUV,
					hasNormals: metadata.hasNormals,
					hasColors: metadata.hasColors,
					boundingBox: metadata.boundingBox,
					updatedAt: new Date(),
				})
				.where(eq(file3Ds.id, entityId));

			return { success: true };
		} catch (error) {
			console.warn('❌ Error al extraer metadata de archivo 3D:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Extrae metadata específica de archivos 3D
	 */
	private async extractFile3DMetadata(filePath: string) {
		const extension = filePath.toLowerCase().split('.').pop() || '';

		// Determinar el formato basado en la extensión
		const format = extension;
		let metadata: any = {
			format,
			version: null,
			vertices: null,
			faces: null,
			triangles: null,
			materials: null,
			textures: null,
			animations: null,
			bones: null,
			scenes: null,
			cameras: null,
			lights: null,
			hasUV: null,
			hasNormals: null,
			hasColors: null,
			boundingBox: null,
		};

		// Parsear según el tipo de archivo
		try {
			if (extension === 'gltf') {
				metadata = { ...metadata, ...(await this.parseGltf(filePath)) };
			} else if (extension === 'obj') {
				metadata = { ...metadata, ...(await this.parseObj(filePath)) };
			}
			// Se pueden agregar más parsers para otros formatos (fbx, dae, etc.)
		} catch (parseError) {
			console.warn(`Warning: Could not parse ${extension} file:`, parseError);
		}

		return metadata;
	}

	/**
	 * Parser para archivos GLTF
	 */
	private async parseGltf(filePath: string) {
		try {
			const content = await readFile(filePath, 'utf-8');
			const gltf = JSON.parse(content);

			const metadata: any = {
				version: gltf.asset?.version || null,
				scenes: gltf.scenes?.length || null,
				cameras: gltf.cameras?.length || null,
				lights: gltf.extensions?.KHR_lights_punctual?.lights?.length || null,
			};

			// Contar vértices, caras, materiales, etc.
			if (gltf.meshes) {
				let totalVertices = 0;
				let totalFaces = 0;

				for (const mesh of gltf.meshes) {
					if (mesh.primitives) {
						for (const primitive of mesh.primitives) {
							if (primitive.attributes?.POSITION !== undefined) {
								const accessor = gltf.accessors?.[primitive.attributes.POSITION];
								if (accessor) {
									totalVertices += accessor.count || 0;
								}
							}
							if (primitive.indices !== undefined) {
								const accessor = gltf.accessors?.[primitive.indices];
								if (accessor) {
									totalFaces += Math.floor((accessor.count || 0) / 3);
								}
							}
						}
					}
				}

				metadata.vertices = totalVertices;
				metadata.faces = totalFaces;
				metadata.triangles = totalFaces; // Para triángulos
			}

			metadata.materials = gltf.materials?.length || null;
			metadata.textures = gltf.textures?.length || null;
			metadata.animations = gltf.animations?.length || null;

			// Verificar si tiene UV, normales, colores
			if (gltf.meshes) {
				let hasUV = false;
				let hasNormals = false;
				let hasColors = false;

				for (const mesh of gltf.meshes) {
					if (mesh.primitives) {
						for (const primitive of mesh.primitives) {
							if (primitive.attributes?.TEXCOORD_0 !== undefined) hasUV = true;
							if (primitive.attributes?.NORMAL !== undefined) hasNormals = true;
							if (primitive.attributes?.COLOR_0 !== undefined) hasColors = true;
						}
					}
				}

				metadata.hasUV = hasUV;
				metadata.hasNormals = hasNormals;
				metadata.hasColors = hasColors;
			}

			return metadata;
		} catch (error) {
			console.warn('Error parsing GLTF:', error);
			return {};
		}
	}

	/**
	 * Parser para archivos OBJ
	 */
	private async parseObj(filePath: string) {
		try {
			const content = await readFile(filePath, 'utf-8');
			const lines = content.split('\n');

			let vertices = 0;
			let faces = 0;
			let hasUV = false;
			let hasNormals = false;

			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed.startsWith('v ')) vertices++;
				else if (trimmed.startsWith('f ')) faces++;
				else if (trimmed.startsWith('vt ')) hasUV = true;
				else if (trimmed.startsWith('vn ')) hasNormals = true;
			}

			return {
				vertices,
				faces,
				triangles: faces, // Asumimos que las caras son triángulos
				hasUV,
				hasNormals,
				hasColors: false, // OBJ básico no incluye información de color
			};
		} catch (error) {
			console.warn('Error parsing OBJ:', error);
			return {};
		}
	}
}
