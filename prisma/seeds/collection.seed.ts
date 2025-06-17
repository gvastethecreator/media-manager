import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las colecciones por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedCollections(prisma: PrismaClient): Promise<void> {
	seedLogger.info('📚 Creando colecciones por defecto...');

	try {
		if (await tableExists(prisma, 'Collection')) {
			const collections = [
				{
					name: 'Grimorio Arcano',
					description: 'Antigua compilación de conocimientos mágicos, teorías arcanas y rituales prohibidos.',
					emoji: '✨',
					color: '#8b5cf6',
					category: 'magic',
					filters: JSON.stringify({
						sections: [
							{
								title: 'Teorías Elementales',
								description: 'Estudios sobre la naturaleza de los elementos mágicos',
							},
							{
								title: 'Rituales Prohibidos',
								description: 'Documentación sobre prácticas mágicas peligrosas',
							},
							{
								title: 'Artefactos Legendarios',
								description: 'Catálogo de objetos mágicos poderosos',
							},
						],
						tags: ['magia', 'rituales', 'elementos'],
					}),
					featuredImage: null,
					isFavorite: true,
				},
				{
					name: 'Crónicas de Guerra',
					description: 'Registros detallados de las grandes batallas y conflictos del reino.',
					emoji: '⚔️',
					color: '#ef4444',
					category: 'history',
					filters: JSON.stringify({
						sections: [
							{
								title: 'Guerras del Norte',
								description: 'Conflictos con los clanes guerreros del norte',
							},
							{
								title: 'Batallas Legendarias',
								description: 'Encuentros históricos que cambiaron el reino',
							},
							{
								title: 'Tácticas Militares',
								description: 'Estrategias y formaciones de combate',
							},
						],
						tags: ['guerra', 'batallas', 'historia'],
					}),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Compendio del Reino',
					description: 'Documentos oficiales, tratados y registros de la administración del reino.',
					emoji: '👑',
					color: '#f59e0b',
					category: 'politics',
					filters: JSON.stringify({
						sections: [
							{
								title: 'Leyes Reales',
								description: 'Edictos y decretos del monarca',
							},
							{
								title: 'Tratados Comerciales',
								description: 'Acuerdos con otros reinos y gremios',
							},
							{
								title: 'Registros Nobiliarios',
								description: 'Linajes y títulos de la nobleza',
							},
						],
						tags: ['política', 'leyes', 'nobleza'],
					}),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Leyendas del Norte',
					description: 'Recopilación de historias, mitos y tradiciones de las tierras heladas.',
					emoji: '❄️',
					color: '#3b82f6',
					category: 'culture',
					filters: JSON.stringify({
						sections: [
							{
								title: 'Sagas Ancestrales',
								description: 'Historias transmitidas por generaciones',
							},
							{
								title: 'Ritos del Hielo',
								description: 'Tradiciones y ceremonias del norte',
							},
							{
								title: 'Profecías Invernales',
								description: 'Predicciones de los videntes del hielo',
							},
						],
						tags: ['norte', 'tradiciones', 'leyendas'],
					}),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Secretos del Abismo',
					description: 'Investigaciones y descubrimientos sobre la naturaleza del Abismo y sus efectos.',
					emoji: '🕳️',
					color: '#1e293b',
					category: 'research',
					filters: JSON.stringify({
						sections: [
							{
								title: 'Manifestaciones Abismales',
								description: 'Documentación de fenómenos del Abismo',
							},
							{
								title: 'Estudios de Corrupción',
								description: 'Efectos del Abismo en seres vivos',
							},
							{
								title: 'Teorías Dimensionales',
								description: 'Hipótesis sobre la naturaleza del Abismo',
							},
						],
						tags: ['abismo', 'investigación', 'dimensional'],
					}),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Tomo de las Órdenes',
					description: 'Historia y documentación de las principales órdenes y organizaciones.',
					emoji: '🛡️',
					color: '#e5e7eb',
					category: 'organizations',
					filters: JSON.stringify({
						sections: [
							{
								title: 'Orden de la Luz Eterna',
								description: 'Historia y principios de los paladines',
							},
							{
								title: 'Círculo del Equilibrio',
								description: 'Tradiciones de los druidas',
							},
							{
								title: 'Hermandad de las Sombras',
								description: 'Secretos de los asesinos',
							},
						],
						tags: ['órdenes', 'organizaciones', 'hermandades'],
					}),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Códice de Criaturas',
					description: 'Bestiario detallado de las criaturas y seres del reino.',
					emoji: '🐉',
					color: '#10b981',
					category: 'bestiary',
					filters: JSON.stringify({
						sections: [
							{
								title: 'Bestias Mágicas',
								description: 'Catálogo de criaturas mágicas',
							},
							{
								title: 'Aberraciones Abismales',
								description: 'Seres corrompidos por el Abismo',
							},
							{
								title: 'Espíritus y Apariciones',
								description: 'Entidades sobrenaturales',
							},
						],
						tags: ['criaturas', 'bestias', 'monstruos'],
					}),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Atlas del Reino',
					description: 'Mapas y descripciones de las tierras conocidas y sus secretos.',
					emoji: '🗺️',
					color: '#6b7280',
					category: 'geography',
					filters: JSON.stringify({
						sections: [
							{
								title: 'Tierras del Norte',
								description: 'Geografía de las regiones heladas',
							},
							{
								title: 'Rutas Comerciales',
								description: 'Caminos y pasos importantes',
							},
							{
								title: 'Lugares Místicos',
								description: 'Ubicaciones de poder mágico',
							},
						],
						tags: ['mapas', 'geografía', 'lugares'],
					}),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Bestiario Fantástico',
					description: 'Colección de criaturas y monstruos legendarios.',
					emoji: '🐉',
					color: '#22d3ee',
					category: 'bestiario',
					filters: JSON.stringify({ tags: ['criaturas', 'monstruos'] }),
					featuredImage: null,
					isFavorite: false,
				},
			];

			for (const collection of collections) {
				const existingCollection = await prisma.collection.findFirst({
					where: { name: collection.name },
				});

				if (!existingCollection) {
					await prisma.collection.create({
						data: collection,
					});
				}
			}

			seedLogger.info('✅ Colecciones creadas correctamente');
		} else {
			seedLogger.warn('⚠️ La tabla Collection no existe, omitiendo...');
		}
	} catch (error) {
		seedLogger.error('❌ Error creando colecciones:', error);
		throw error;
	}
}
