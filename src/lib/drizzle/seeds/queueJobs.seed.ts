import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { queueJobs } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra trabajos de cola minimalistas para verificación del sistema
 */
export async function seedQueueJobs(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('⚙️ Creando trabajos de cola de prueba...');

	try {
		const sampleQueueJobs = [
			{
				id: 'job-1',
				queue: 'image-processing',
				data: JSON.stringify({ imageId: 'img-1', operation: 'resize' }),
				status: 'completed',
				attempts: 1,
				maxAttempts: 3,
				progress: 100,
				priority: 1,
				metadata: JSON.stringify({ size: '1920x1080', format: 'jpg' }),
			},
			{
				id: 'job-2',
				queue: 'video-processing',
				data: JSON.stringify({ videoId: 'vid-1', operation: 'transcode' }),
				status: 'pending',
				attempts: 0,
				maxAttempts: 3,
				progress: 0,
				priority: 2,
				metadata: JSON.stringify({ format: 'mp4', quality: 'high' }),
			},
		];

		await db.insert(queueJobs).values(sampleQueueJobs);
		seedLogger.success(`✅ ${sampleQueueJobs.length} trabajos de cola creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando trabajos de cola:', error);
		throw error;
	}
}
