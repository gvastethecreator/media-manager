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
					description: 'Contenido seleccionado como favorito',
					shortcut: 'fav',
					category: 'estado',
				},
				{
					name: 'Importante',
					emoji: '🔥',
					color: '#ef4444',
					description: 'Contenido importante que requiere atención',
					shortcut: 'imp',
					category: 'estado',
				},
				{
					name: 'Referencia',
					emoji: '📚',
					color: '#8b5cf6',
					description: 'Material de referencia para consulta',
					shortcut: 'ref',
					category: 'propósito',
				},
				{
					name: 'Inspiración',
					emoji: '💡',
					color: '#10b981',
					description: 'Contenido que sirve como inspiración',
					shortcut: 'ins',
					category: 'propósito',
				},
				{
					name: 'Pendiente',
					emoji: '⏳',
					color: '#f59e0b',
					description: 'Contenido pendiente de procesar',
					shortcut: 'pen',
					category: 'estado',
				},
				{
					name: 'Fantasía',
					emoji: '🧙‍♂️',
					color: '#8b5cf6',
					description: 'Contenido relacionado con el género de fantasía',
					shortcut: 'fan',
					category: 'género',
				},
				{
					name: 'Sci-Fi',
					emoji: '🚀',
					color: '#3b82f6',
					description: 'Contenido relacionado con ciencia ficción',
					shortcut: 'sci',
					category: 'género',
				},
				{
					name: 'Terror',
					emoji: '👻',
					color: '#6b7280',
					description: 'Contenido relacionado con horror y terror',
					shortcut: 'ter',
					category: 'género',
				},
				{
					name: 'Paisaje',
					emoji: '🏞️',
					color: '#10b981',
					description: 'Vistas y escenarios naturales',
					shortcut: 'pai',
					category: 'contenido',
				},
				{
					name: 'Retrato',
					emoji: '👤',
					color: '#8b5cf6',
					description: 'Retratos de personajes o personas',
					shortcut: 'ret',
					category: 'contenido',
				},
				{
					name: 'Concept Art',
					emoji: '🎨',
					color: '#3b82f6',
					description: 'Arte conceptual para proyectos',
					shortcut: 'con',
					category: 'estilo',
				},
				{
					name: 'Pixel Art',
					emoji: '👾',
					color: '#ec4899',
					description: 'Arte pixel y estilo retro',
					shortcut: 'pix',
					category: 'estilo',
				},
				{
					name: 'Realista',
					emoji: '📷',
					color: '#4b5563',
					description: 'Estilo artístico realista o fotorrealista',
					shortcut: 'rea',
					category: 'estilo',
				},
				{
					name: 'Cartoon',
					emoji: '🎭',
					color: '#f59e0b',
					description: 'Estilo caricatura o animado',
					shortcut: 'car',
					category: 'estilo',
				},
				{
					name: 'Abstracto',
					emoji: '🔮',
					color: '#8b5cf6',
					description: 'Arte abstracto y experimental',
					shortcut: 'abs',
					category: 'estilo',
				},
				{
					name: 'Alta Calidad',
					emoji: '💎',
					color: '#3b82f6',
					description: 'Contenido de alta resolución o calidad',
					shortcut: 'hq',
					category: 'calidad',
				},
				{
					name: 'WIP',
					emoji: '🔨',
					color: '#f59e0b',
					description: 'Trabajo en progreso',
					shortcut: 'wip',
					category: 'estado',
				},
				{
					name: 'Finalizado',
					emoji: '✅',
					color: '#10b981',
					description: 'Proyectos o contenido completado',
					shortcut: 'fin',
					category: 'estado',
				},
				{
					name: 'Revisión',
					emoji: '🔍',
					color: '#6b7280',
					description: 'Necesita revisión o feedback',
					shortcut: 'rev',
					category: 'estado',
				},
				{
					name: 'Meme',
					emoji: '😂',
					color: '#f59e0b',
					description: 'Contenido humorístico o memes',
					shortcut: 'mem',
					category: 'contenido',
				},
				{
					name: 'Wallpaper',
					emoji: '🖥️',
					color: '#3b82f6',
					description: 'Imágenes para fondos de pantalla',
					shortcut: 'wal',
					category: 'propósito',
				},
				{
					name: 'Videojuego',
					emoji: '🎮',
					color: '#8b5cf6',
					description: 'Contenido relacionado con videojuegos',
					shortcut: 'game',
					category: 'tema',
				},
				{
					name: 'Animación',
					emoji: '🎬',
					color: '#ec4899',
					description: 'Material para animación o animado',
					shortcut: 'ani',
					category: 'tipo',
				},
				{
					name: 'Ilustración',
					emoji: '✏️',
					color: '#6b7280',
					description: 'Trabajo de ilustración artística',
					shortcut: 'ilu',
					category: 'tipo',
				}
			],
		});

		seedLogger.info('✅ Tags por defecto creados');
	} else {
		seedLogger.warn('⚠️ La tabla Tag no existe, saltando creación de tags');
	}
}
