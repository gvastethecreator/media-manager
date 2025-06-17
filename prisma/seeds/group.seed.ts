import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los grupos por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedGroups(prisma: PrismaClient): Promise<void> {
	seedLogger.info('👥 Creando grupos por defecto...');

	try {
		if (await tableExists(prisma, 'Group')) {
			const groupsData = [
				{
					name: 'Guardianes del Reino',
					emoji: '⚔️',
					color: '#3b82f6',
					description: 'Protectores del reino y sus habitantes',
					shortcut: 'guardianes',
					category: 'personajes',
					sortBy: 'name',
					filters: JSON.stringify([
						'character:Liora la Portadora de Luz',
						'character:Kael el Caminante del Abismo',
						'character:Aldric el Hueco',
						'concept:Orden de la Luz Eterna',
						'place:Ruinas Malditas',
						'place:El Abismo',
					]),
					featuredImage: null,
					isFavorite: true,
				},
				{
					name: 'Maestros del Arte Arcano',
					emoji: '✨',
					color: '#8b5cf6',
					description: 'Practicantes de las artes mágicas más poderosas',
					shortcut: 'magos',
					category: 'personajes',
					sortBy: 'name',
					filters: JSON.stringify([
						'character:Elyra la Cenicienta',
						'character:Eryndor el Eterno',
						'character:Morrigan la Velada',
						'concept:Sistema de Magia',
						'concept:Piromancia Ancestral',
						'concept:Arte de la Necromancia Superior',
					]),
					featuredImage: null,
					isFavorite: true,
				},
				{
					name: 'Vigilantes del Equilibrio',
					emoji: '🌿',
					color: '#10b981',
					description: 'Protectores de la naturaleza y el equilibrio',
					shortcut: 'vigilantes',
					category: 'personajes',
					sortBy: 'name',
					filters: JSON.stringify([
						'character:Garruk el Salvaje',
						'character:Isolda la Nacida del Hielo',
						'concept:Círculo Druídico del Equilibrio',
						'concept:Clanes Guerreros del Norte',
						'place:Bosque Primordial',
						'place:Tierras del Norte Helado',
					]),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Señores de la Oscuridad',
					emoji: '🌑',
					color: '#1e293b',
					description: 'Practicantes de artes oscuras y fuerzas siniestras',
					shortcut: 'oscuros',
					category: 'personajes',
					sortBy: 'name',
					filters: JSON.stringify([
						'character:Eryndor el Eterno',
						'character:Vorrik el Demente',
						'character:Tharok el Devastador',
						'concept:Pactos de los Brujos',
						'concept:Arte de la Necromancia Superior',
						'concept:El Abismo y sus Manifestaciones',
					]),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Conocimiento Arcano',
					emoji: '📚',
					color: '#6b7280',
					description: 'Colección de saberes mágicos y místicos',
					shortcut: 'arcano',
					category: 'conocimiento',
					sortBy: 'name',
					filters: JSON.stringify([
						'concept:Sistema de Magia',
						'concept:Piromancia Ancestral',
						'concept:Arte de la Necromancia Superior',
						'concept:Pactos de los Brujos',
						'place:Biblioteca Prohibida',
						'collection:Grimorio Arcano',
					]),
					featuredImage: null,
					isFavorite: true,
				},
				{
					name: 'Tierras Místicas',
					emoji: '🗺️',
					color: '#9ca3af',
					description: 'Lugares de poder y maravillas del reino',
					shortcut: 'lugares',
					category: 'lugares',
					sortBy: 'name',
					filters: JSON.stringify([
						'place:El Abismo',
						'place:Tierras del Norte Helado',
						'place:Bosque Primordial',
						'place:Biblioteca Prohibida',
						'place:Ruinas Malditas',
						'place:Templo Caído',
					]),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Artefactos de Poder',
					emoji: '⚡',
					color: '#f59e0b',
					description: 'Objetos mágicos y reliquias legendarias',
					shortcut: 'artefactos',
					category: 'objetos',
					sortBy: 'name',
					filters: JSON.stringify([
						'worlditem:Espada Maldita',
						'worlditem:Báculo de las Brasas',
						'worlditem:Espada del Abismo',
						'worlditem:Báculo de la Eternidad',
						'worlditem:Hacha de Escarcha',
						'prompt:Objeto Mágico',
					]),
					featuredImage: null,
					isFavorite: false,
				},
				{
					name: 'Historias y Leyendas',
					emoji: '📜',
					color: '#e5e7eb',
					description: 'Registros históricos y leyendas del reino',
					shortcut: 'historias',
					category: 'lore',
					sortBy: 'name',
					filters: JSON.stringify([
						'collection:Crónicas de Guerra',
						'collection:Leyendas del Norte',
						'concept:La Maldición de la No-Muerte',
						'concept:El Abismo y sus Manifestaciones',
						'concept:Clanes Guerreros del Norte',
						'concept:Orden de la Luz Eterna',
					]),
					featuredImage: null,
					isFavorite: true,
				},
				{
					name: 'Círculo de Sabios',
					emoji: '🧙‍♂️',
					color: '#fbbf24',
					description: 'Consejo de magos y eruditos',
					shortcut: 'sabios',
					category: 'personajes',
					sortBy: 'name',
					filters: JSON.stringify(['character:Elyra la Cenicienta']),
					featuredImage: null,
					isFavorite: false,
				},
			];

			for (const group of groupsData) {
				const existingGroup = await prisma.group.findFirst({
					where: { name: group.name },
				});

				if (!existingGroup) {
					await prisma.group.create({
						data: group,
					});
				}
			}

			seedLogger.info('✅ Grupos creados correctamente');
		} else {
			seedLogger.warn('⚠️ La tabla Group no existe, omitiendo...');
		}
	} catch (error) {
		seedLogger.error('❌ Error creando grupos:', error);
		throw error;
	}
}
