import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { file3Ds } from '../schema/index';
import { seedLogger } from './index';

/**
 * Seed para archivos 3D - datos de prueba sin asociaciones
 */
export async function seedFile3Ds(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎲 Creando archivos 3D de prueba (sin asociaciones)...');

	try {
		const sampleFile3Ds = [
			{
				id: '3d-seed-001',
				name: 'test-3d.glb',
				path: 'D:\\DEV\\image-manager\\test-files\\test-3d.glb',
				size: 10240,
				hash: 'd3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b865',
				mimeType: 'model/gltf-binary',
				extension: 'glb',
				folderId: 'test-files',
				isFavorite: false,
				isArchived: false,
			},
		];

		await db.insert(file3Ds).values(sampleFile3Ds);
		seedLogger.success(`✅ ${sampleFile3Ds.length} archivos 3D creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando archivos 3D:', error);
		throw error;
	}
}
