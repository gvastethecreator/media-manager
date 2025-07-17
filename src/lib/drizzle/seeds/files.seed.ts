import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { files } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra archivos genéricos minimalistas para verificación del sistema
 */
export async function seedFiles(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📄 Creando archivos genéricos de prueba...');

	try {
		const sampleFiles = [
			{
				id: 'file-1',
				name: 'config.json',
				path: '/system/config/config.json',
				folderId: 'folder-1',
				size: 2048,
				mimeType: 'application/json',
				fileType: 'document',
				extension: 'json',
				checksum: 'abc123def456',
				hash: 'sha256:abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
				metadata: JSON.stringify({ version: '1.0', type: 'configuration' }),
				isProcessed: true,
				processingStatus: 'completed',
			},
			{
				id: 'file-2',
				name: 'backup.zip',
				path: '/backups/backup.zip',
				folderId: 'folder-2',
				size: 1048576,
				mimeType: 'application/zip',
				fileType: 'archive',
				extension: 'zip',
				checksum: 'def456ghi789',
				hash: 'sha256:def456ghi789jkl012mno345pqr678stu901vwx234yz567abc',
				metadata: JSON.stringify({ compressed: true, type: 'backup' }),
				isProcessed: false,
				processingStatus: 'pending',
			},
		];

		await db.insert(files).values(sampleFiles);
		seedLogger.success(`✅ ${sampleFiles.length} archivos genéricos creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando archivos genéricos:', error);
		throw error;
	}
}
