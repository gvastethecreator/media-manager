import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los comodines por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedWildcards(prisma: PrismaClient): Promise<void> {
	seedLogger.info('🎭 Creando comodines por defecto...');

	// Verificar si la tabla Wildcard existe
	if (await tableExists(prisma, 'Wildcard')) {
		// Crear wildcards por defecto
		await prisma.wildcard.createMany({
			data: [
				// Wildcards para estilos artísticos
				{
					name: 'Estilos Artísticos',
					emoji: '🎨',
					color: '#8b5cf6',
					description: 'Categoría principal para diferentes estilos de arte',
					shortcut: 'art-style',
					category: 'estilos',
					children: JSON.stringify(['Pixel Art', 'Acuarela', 'Óleo', '3D', 'Vectorial']),
					featuredImage: null,
					isFavorite: true,
					parentId: null,
				},
				{
					name: 'Pixel Art',
					emoji: '👾',
					color: '#ec4899',
					description: 'Arte pixelado de estilo retro',
					shortcut: 'pixel',
					category: 'estilos',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Acuarela',
					emoji: '💦',
					color: '#0ea5e9',
					description: 'Técnica de pintura con acuarelas',
					shortcut: 'water',
					category: 'estilos',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Óleo',
					emoji: '🖌️',
					color: '#f59e0b',
					description: 'Técnica de pintura con óleos',
					shortcut: 'oil',
					category: 'estilos',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: '3D',
					emoji: '🧊',
					color: '#10b981',
					description: 'Arte y modelado tridimensional',
					shortcut: '3d',
					category: 'estilos',
					children: JSON.stringify(['Realista 3D', 'Low Poly', 'Sculpting']),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Realista 3D',
					emoji: '📷',
					color: '#6b7280',
					description: 'Modelado 3D con aspecto fotorrealista',
					shortcut: 'real3d',
					category: 'estilos',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Low Poly',
					emoji: '📐',
					color: '#ef4444',
					description: 'Modelado 3D con pocos polígonos y estilo minimalista',
					shortcut: 'lowpoly',
					category: 'estilos',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Vectorial',
					emoji: '⚡',
					color: '#3b82f6',
					description: 'Arte basado en vectores, escalable y limpio',
					shortcut: 'vector',
					category: 'estilos',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Sketch',
					emoji: '✏️',
					color: '#64748b',
					description: 'Bocetos y dibujos rápidos',
					shortcut: 'sketch',
					category: 'estilos',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null,
				},

				// Wildcards para colores dominantes
				{
					name: 'Colores Dominantes',
					emoji: '🌈',
					color: '#ef4444',
					description: 'Categoría para esquemas de color predominantes',
					shortcut: 'colors',
					category: 'colores',
					children: JSON.stringify(['Cálidos', 'Fríos', 'Monocromáticos', 'Pastel']),
					featuredImage: null,
					isFavorite: false,
					parentId: null,
				},
				{
					name: 'Cálidos',
					emoji: '🔥',
					color: '#f59e0b',
					description: 'Esquemas dominados por colores cálidos (rojos, naranjas, amarillos)',
					shortcut: 'warm',
					category: 'colores',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Fríos',
					emoji: '❄️',
					color: '#0ea5e9',
					description: 'Esquemas dominados por colores fríos (azules, verdes, violetas)',
					shortcut: 'cold',
					category: 'colores',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Monocromáticos',
					emoji: '⚪',
					color: '#6b7280',
					description: 'Esquemas basados en un solo color y sus tonalidades',
					shortcut: 'mono',
					category: 'colores',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Pastel',
					emoji: '🍦',
					color: '#d8b4fe',
					description: 'Colores suaves y claros con baja saturación',
					shortcut: 'pastel',
					category: 'colores',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},

				// Wildcards para tipos de composición
				{
					name: 'Composiciones',
					emoji: '📐',
					color: '#0ea5e9',
					description: 'Diferentes tipos de composición visual',
					shortcut: 'comp',
					category: 'composición',
					children: JSON.stringify(['Simétrica', 'Regla Tercios', 'Triangular', 'Radial']),
					featuredImage: null,
					isFavorite: false,
					parentId: null,
				},
				{
					name: 'Simétrica',
					emoji: '🪞',
					color: '#3b82f6',
					description: 'Composición con simetría vertical u horizontal',
					shortcut: 'sym',
					category: 'composición',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Regla Tercios',
					emoji: '📏',
					color: '#8b5cf6',
					description: 'Composición siguiendo la regla de los tercios',
					shortcut: 'thirds',
					category: 'composición',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Triangular',
					emoji: '🔺',
					color: '#ef4444',
					description: 'Composición con forma triangular',
					shortcut: 'tri',
					category: 'composición',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
				{
					name: 'Radial',
					emoji: '⭕',
					color: '#f59e0b',
					description: 'Composición con patrón radial desde el centro',
					shortcut: 'rad',
					category: 'composición',
					children: JSON.stringify([]),
					featuredImage: null,
					isFavorite: false,
					parentId: null, // Se actualizará después
				},
			],
		});

		// En este punto tendríamos que actualizar las relaciones parentId
		// pero eso requeriría primero obtener los IDs de los registros creados
		seedLogger.info('✅ Comodines creados correctamente');
		seedLogger.info('⚠️ Nota: Las relaciones jerárquicas entre comodines deben establecerse manualmente');
	} else {
		seedLogger.warn('⚠️ La tabla Wildcard no existe, omitiendo...');
	}
}
