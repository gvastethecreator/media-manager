import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { file3Ds } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra archivos 3D de ejemplo para verificación del sistema
 * NOTA: Estas son referencias de ejemplo, no archivos reales
 */
export async function seedFile3Ds(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎲 Creando archivos 3D de ejemplo...');

	try {
		const sampleFile3Ds = [
			{
				id: '3d-1',
				name: 'character-model.fbx',
				path: '/examples/3d/character-model.fbx',
				size: 10485760, // 10MB
				mimeType: 'application/octet-stream',
				extension: 'fbx',
				hash: '3d123abc456def789',
				format: 'FBX',
				vertices: 15000,
				faces: 12000,
				materials: 3,
				textures: 5,
				animations: 8,
				boundingBox: JSON.stringify({
					min: { x: -1.5, y: 0, z: -0.8 },
					max: { x: 1.5, y: 3.2, z: 0.8 },
				}),
				folderId: '3d-models',
				isFavorite: true,
			},
			{
				id: '3d-2',
				name: 'environment-scene.obj',
				path: '/examples/3d/environment-scene.obj',
				size: 5242880, // 5MB
				mimeType: 'application/octet-stream',
				extension: 'obj',
				hash: '3d456def789ghi012',
				format: 'OBJ',
				vertices: 25000,
				faces: 20000,
				materials: 8,
				textures: 12,
				animations: 0,
				boundingBox: JSON.stringify({
					min: { x: -50, y: 0, z: -50 },
					max: { x: 50, y: 25, z: 50 },
				}),
				folderId: '3d-environments',
				isFavorite: false,
			},
		];

		await db.insert(file3Ds).values(sampleFile3Ds);
		seedLogger.success(`✅ ${sampleFile3Ds.length} archivos 3D de ejemplo creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando archivos 3D de ejemplo:', error);
		throw error;
	}
}
