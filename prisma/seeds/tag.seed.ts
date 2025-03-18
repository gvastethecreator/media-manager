import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los tags por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedTags(prisma: PrismaClient): Promise<void> {
	seedLogger.info('🏷️ Creando tags por defecto...');

	// Verificar si la tabla Tag existe
	if (await tableExists(prisma, 'Tag')) {
		// Crear tags por defecto
		await prisma.tag.createMany({
			data: [
				{
					name: 'Favorito',
					emoji: '⭐',
					color: '#eab308',
					description: 'Imágenes favoritas',
					shortcut: 'fav',
				},
				{
					name: 'Importante',
					emoji: '🔥',
					color: '#ef4444',
					description: 'Imágenes importantes',
					shortcut: 'imp',
				},
				{
					name: 'Referencia',
					emoji: '📚',
					color: '#8b5cf6',
					description: 'Imágenes de referencia',
					shortcut: 'ref',
				},
				{
					name: 'Inspiración',
					emoji: '💡',
					color: '#10b981',
					description: 'Imágenes inspiradoras',
					shortcut: 'ins',
				},
				{
					name: 'Pendiente',
					emoji: '⏳',
					color: '#f59e0b',
					description: 'Imágenes pendientes de procesar',
					shortcut: 'pen',
				},
			],
		});

		seedLogger.info('✅ Tags por defecto creados');
	} else {
		seedLogger.warn('⚠️ La tabla Tag no existe, saltando creación de tags');
	}
}
