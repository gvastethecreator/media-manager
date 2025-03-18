import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los conceptos por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedConcepts(prisma: PrismaClient): Promise<void> {
	seedLogger.info('💡 Creando conceptos por defecto...');

	// Verificar si la tabla Concept existe
	if (await tableExists(prisma, 'Concept')) {
		// Crear conceptos por defecto
		await prisma.concept.createMany({
			data: [
				{
					name: 'Mitología Nórdica',
					emoji: '⚡',
					color: '#3b82f6',
					description: 'Conceptos relacionados con la mitología nórdica',
					content:
						'La mitología nórdica es el conjunto de mitos pertenecientes a la religión tradicional precristiana de los pueblos escandinavos, incluyendo aquellos que habitaban en Islandia, donde las fuentes escritas de la mitología nórdica fueron reunidas.',
					category: 'mitología',
					tags: JSON.stringify(['mitología', 'dioses', 'leyendas']),
				},
				{
					name: 'Aventuras Épicas',
					emoji: '🗡️',
					color: '#8b5cf6',
					description: 'Ideas para historias de aventuras épicas',
					content:
						'Una aventura épica involucra un viaje significativo, desafíos monumentales y crecimiento del protagonista. Suele incluir elementos de fantasía, mitología y conflictos que determinan el destino del mundo.',
					category: 'narrativa',
					tags: JSON.stringify(['aventura', 'épico', 'viaje']),
				},
				{
					name: 'Magia Elemental',
					emoji: '✨',
					color: '#ef4444',
					description: 'Sistema de magia basado en los elementos',
					content:
						'La magia elemental se basa en el control y manipulación de los elementos naturales: fuego, agua, tierra y aire. Cada elemento tiene sus propias características, fortalezas y debilidades.',
					category: 'sistemas',
					tags: JSON.stringify(['magia', 'elementos', 'sistema']),
				},
				{
					name: 'Cyberpunk',
					emoji: '🤖',
					color: '#10b981',
					description: 'Estética y temas del género cyberpunk',
					content:
						'El cyberpunk es un subgénero de ciencia ficción que presenta futuros distópicos con tecnología avanzada junto con un bajo nivel de vida. Combina alta tecnología y baja calidad de vida.',
					category: 'géneros',
					tags: JSON.stringify(['cyberpunk', 'distopía', 'tecnología']),
				},
				{
					name: 'Criaturas Fantásticas',
					emoji: '🐉',
					color: '#f59e0b',
					description: 'Bestiario de criaturas fantásticas',
					content:
						'Las criaturas fantásticas son seres imaginarios que aparecen en mitos, leyendas y obras de ficción. Van desde dragones y grifos hasta seres más oscuros como los vampiros o los hombres lobo.',
					category: 'bestiario',
					tags: JSON.stringify(['criaturas', 'fantasía', 'monstruos']),
				},
			],
		});
		seedLogger.info('✅ Conceptos creados correctamente');
	} else {
		seedLogger.warn('⚠️ La tabla Concept no existe, omitiendo...');
	}
}
