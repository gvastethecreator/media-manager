import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los álbumes por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedAlbums(prisma: PrismaClient): Promise<void> {
	seedLogger.info('📔 Creando álbumes por defecto...');

	// Verificar si la tabla Album existe
	if (await tableExists(prisma, 'Album')) {
		// Crear álbumes por defecto
		await prisma.album.createMany({
			data: [
				// Álbumes de categoría favoritos
				{
					name: 'Favoritos 2024',
					emoji: '⭐',
					color: '#eab308',
					description: 'Imágenes favoritas del 2024',
					shortcut: 'fav24',
					sortBy: 'createdAt',
					filters: JSON.stringify(['isFavorite:true']),
					category: 'favoritos',
					isFavorite: true,
					featuredImage: null,
				},
				{
					name: 'Destacados',
					emoji: '🌟',
					color: '#f97316',
					description: 'Contenido destacado y seleccionado',
					shortcut: 'dest',
					sortBy: 'updatedAt',
					filters: JSON.stringify(['rating:>4']),
					category: 'favoritos',
					isFavorite: false,
					featuredImage: null,
				},

				// Álbumes de estilos artísticos
				{
					name: 'Pixel Art',
					emoji: '👾',
					color: '#8b5cf6',
					description: 'Colección de pixel art',
					shortcut: 'pixel',
					sortBy: 'name',
					filters: JSON.stringify(['tag:pixel']),
					category: 'estilo',
					isFavorite: false,
					featuredImage: null,
				},
				{
					name: 'Arte Conceptual',
					emoji: '🎨',
					color: '#3b82f6',
					description: 'Arte conceptual y bocetos',
					shortcut: 'concept',
					sortBy: 'createdAt',
					filters: JSON.stringify(['tag:concept']),
					category: 'estilo',
					isFavorite: false,
					featuredImage: null,
				},
				{
					name: 'Estilo Anime',
					emoji: '🇯🇵',
					color: '#ec4899',
					description: 'Ilustraciones en estilo anime',
					shortcut: 'anime',
					sortBy: 'name',
					filters: JSON.stringify(['tag:anime']),
					category: 'estilo',
					isFavorite: false,
					featuredImage: null,
				},
				{
					name: 'Realismo',
					emoji: '📷',
					color: '#6b7280',
					description: 'Arte realista y foto-realista',
					shortcut: 'real',
					sortBy: 'createdAt',
					filters: JSON.stringify(['tag:realistic']),
					category: 'estilo',
					isFavorite: false,
					featuredImage: null,
				},

				// Álbumes temáticos
				{
					name: 'Pepes Collection',
					emoji: '🐸',
					color: '#16a34a',
					description: 'Colección de memes de Pepe',
					shortcut: 'pepe',
					sortBy: 'createdAt',
					filters: JSON.stringify(['tag:pepe', 'tag:meme']),
					category: 'memes',
					isFavorite: false,
					featuredImage: null,
				},
				{
					name: 'Paisajes',
					emoji: '🏞️',
					color: '#10b981',
					description: 'Colección de paisajes',
					shortcut: 'land',
					sortBy: 'name',
					filters: JSON.stringify(['tag:landscape']),
					category: 'temática',
					isFavorite: false,
					featuredImage: null,
				},
				{
					name: 'Personajes',
					emoji: '👤',
					color: '#8b5cf6',
					description: 'Diseños e ilustraciones de personajes',
					shortcut: 'char',
					sortBy: 'name',
					filters: JSON.stringify(['tag:character']),
					category: 'temática',
					isFavorite: false,
					featuredImage: null,
				},

				// Álbumes técnicos
				{
					name: 'Referencias',
					emoji: '📚',
					color: '#64748b',
					description: 'Imágenes de referencia',
					shortcut: 'ref',
					sortBy: 'createdAt',
					filters: JSON.stringify(['tag:reference']),
					category: 'técnico',
					isFavorite: false,
					featuredImage: null,
				},
				{
					name: 'Upscales',
					emoji: '📈',
					color: '#0ea5e9',
					description: 'Imágenes procesadas con upscaling',
					shortcut: 'ups',
					sortBy: 'createdAt',
					filters: JSON.stringify(['tag:upscale']),
					category: 'técnico',
					isFavorite: false,
					featuredImage: null,
				},
				{
					name: 'En Proceso',
					emoji: '🔄',
					color: '#f59e0b',
					description: 'Proyectos en desarrollo',
					shortcut: 'wip',
					sortBy: 'updatedAt',
					filters: JSON.stringify(['tag:wip']),
					category: 'técnico',
					isFavorite: false,
					featuredImage: null,
				},

				// Álbumes por tipo de contenido
				{
					name: 'Arte 3D',
					emoji: '🧊',
					color: '#06b6d4',
					description: 'Renders y modelados 3D',
					shortcut: '3d',
					sortBy: 'createdAt',
					filters: JSON.stringify(['tag:3d']),
					category: 'tipo',
					isFavorite: false,
					featuredImage: null,
				},
				{
					name: 'Fotografía',
					emoji: '📸',
					color: '#4b5563',
					description: 'Fotografías y capturas',
					shortcut: 'photo',
					sortBy: 'createdAt',
					filters: JSON.stringify(['tag:photo']),
					category: 'tipo',
					isFavorite: false,
					featuredImage: null,
				},
				{
					name: 'Wallpapers',
					emoji: '🖥️',
					color: '#2563eb',
					description: 'Fondos de pantalla',
					shortcut: 'wall',
					sortBy: 'createdAt',
					filters: JSON.stringify(['tag:wallpaper']),
					category: 'tipo',
					isFavorite: false,
					featuredImage: null,
				},
			],
		});
		seedLogger.info('✅ Álbumes creados correctamente');
	} else {
		seedLogger.warn('⚠️ La tabla Album no existe, omitiendo...');
	}
}
