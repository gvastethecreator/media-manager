import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { documents } from '../schema/index';
import { seedLogger } from './index';

/**
 * Seed para documentos - datos de prueba sin asociaciones
 */
export async function seedDocuments(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📄 Creando documentos de prueba (sin asociaciones)...');

	try {
		const sampleDocuments = [
			{
				id: 'doc-seed-001',
				name: 'test-document.md',
				path: 'D:\\DEV\\image-manager\\test-files\\test-document.md',
				size: 1024,
				hash: 'a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b862',
				mimeType: 'text/markdown',
				extension: 'md',
				folderId: 'test-files',
				isFavorite: false,
				isArchived: false,
			},
			{
				id: 'doc-seed-002',
				name: 'test-image.txt',
				path: 'D:\\DEV\\image-manager\\test-files\\test-image.txt',
				size: 512,
				hash: 'b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b863',
				mimeType: 'text/plain',
				extension: 'txt',
				folderId: 'test-files',
				isFavorite: false,
				isArchived: false,
			},
		];

		await db.insert(documents).values(sampleDocuments);
		seedLogger.success(`✅ ${sampleDocuments.length} documentos creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando documentos:', error);
		throw error;
	}
}
