import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { documents } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra documentos de ejemplo para verificación del sistema
 * NOTA: Estas son referencias de ejemplo, no archivos reales
 */
export async function seedDocuments(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📄 Creando documentos de ejemplo...');

	try {
		const sampleDocuments = [
			{
				id: 'doc-1',
				name: 'project-proposal.pdf',
				path: '/examples/documents/project-proposal.pdf',
				size: 1048576, // 1MB
				mimeType: 'application/pdf',
				extension: 'pdf',
				pageCount: 15,
				wordCount: 2500,
				language: 'es',
				hash: 'doc123abc456def789',
				content: 'Propuesta de proyecto para desarrollo de aplicación de gestión de imágenes...',
				author: 'Juan Pérez',
				title: 'Propuesta de Proyecto',
				subject: 'Desarrollo de Software',
				creator: 'Microsoft Word',
				keywords: JSON.stringify(['proyecto', 'desarrollo', 'software']),
				folderId: 'documents-folder',
				isFavorite: true,
			},
			{
				id: 'doc-2',
				name: 'user-manual.docx',
				path: '/examples/documents/user-manual.docx',
				size: 2097152, // 2MB
				mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				extension: 'docx',
				pageCount: 45,
				wordCount: 8500,
				language: 'en',
				hash: 'doc456def789ghi012',
				content: 'User Manual for Image Management System. This comprehensive guide covers...',
				author: 'Technical Writing Team',
				title: 'User Manual',
				subject: 'Documentation',
				creator: 'Microsoft Word',
				keywords: JSON.stringify(['manual', 'documentation', 'user guide']),
				folderId: 'documentation-folder',
				isFavorite: false,
			},
		];

		await db.insert(documents).values(sampleDocuments);
		seedLogger.success(`✅ ${sampleDocuments.length} documentos de ejemplo creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando documentos de ejemplo:', error);
		throw error;
	}
}
