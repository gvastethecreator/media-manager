import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las propiedades por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedProperties(prisma: PrismaClient): Promise<void> {
	seedLogger.info('🔍 Creando propiedades por defecto...');

	try {
		// Verificar si la tabla Property existe
		if (await tableExists(prisma, 'Property')) {
			// Definir propiedades de ejemplo
			const sampleProperties = [
				{
					name: 'Calidad',
					emoji: '⭐',
					color: '#FFD700',
					description: 'Indica la calidad de generación de la imagen',
					shortcut: 'q',
					category: 'technical',
					isFavorite: true,
				},
				{
					name: 'Estilo',
					emoji: '🎨',
					color: '#FF69B4',
					description: 'Estilo artístico de la imagen',
					shortcut: 's',
					category: 'artistic',
					isFavorite: true,
				},
				{
					name: 'Versión',
					emoji: '🔄',
					color: '#4169E1',
					description: 'Versión del modelo utilizado',
					shortcut: 'v',
					category: 'technical',
					isFavorite: false,
				},
				{
					name: 'Paleta de colores',
					emoji: '🌈',
					color: '#9370DB',
					description: 'Paleta de colores predominante',
					shortcut: 'c',
					category: 'artistic',
					isFavorite: false,
				},
				{
					name: 'Proporciones',
					emoji: '📐',
					color: '#3CB371',
					description: 'Proporciones de la imagen',
					shortcut: 'r',
					category: 'technical',
					isFavorite: false,
				},
				{
					name: 'Mood',
					emoji: '😊',
					color: '#FF7F50',
					description: 'Estado de ánimo o ambiente de la imagen',
					shortcut: 'm',
					category: 'artistic',
					isFavorite: false,
				},
				{
					name: 'Tiempo de generación',
					emoji: '⏱️',
					color: '#20B2AA',
					description: 'Tiempo que tomó generar la imagen',
					category: 'technical',
					isFavorite: false,
				},
				{
					name: 'Curator',
					emoji: '👩‍🎨',
					color: '#BA55D3',
					description: 'Persona que curó o seleccionó la imagen',
					category: 'management',
					isFavorite: false,
				},
				{
					name: 'Estado de revisión',
					emoji: '✅',
					color: '#32CD32',
					description: 'Estado de revisión de la imagen',
					category: 'management',
					isFavorite: true,
				},
				{
					name: 'Prioridad',
					emoji: '🎯',
					color: '#DC143C',
					description: 'Nivel de prioridad del elemento',
					category: 'management',
					isFavorite: true,
				},
				{
					name: 'Resolución',
					emoji: '🖼️',
					color: '#00BFFF',
					description: 'Resolución de la imagen',
					shortcut: 'res',
					category: 'technical',
					isFavorite: false,
				},
			];

			// Crear propiedades
			for (const propertyData of sampleProperties) {
				await prisma.property.create({
					data: propertyData,
				});
			}

			seedLogger.info(`✅ ${sampleProperties.length} propiedades creadas`);
		} else {
			seedLogger.warn('⚠️ La tabla Property no existe, saltando creación de propiedades');
		}
	} catch (error) {
		seedLogger.error('❌ Error creando propiedades:', error);
		throw error;
	}
}
