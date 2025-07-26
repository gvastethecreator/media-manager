/**
 * @file Serializadores para la entidad Group
 * @module transformers/group/serializers
 * @description Funciones para serializar datos de Group para API y UI
 
 */

import type { GroupWithStats } from '../../types/entities/group';

/**
 * Serializa un objeto GroupWithStats para respuesta de API
 */
export function serializeGroup(group: GroupWithStats) {
	return {
		id: group.id,
		name: group.name,
		description: group.description,
		emoji: group.emoji,
		color: group.color,
		isFavorite: group.isFavorite,
		createdAt: group.createdAt.toISOString(),
		updatedAt: group.updatedAt.toISOString(),
		stats: group.stats,
	};
}

/**
 * Serializa un array de GroupWithStats para respuesta de API
 */
export function serializeGroups(groups: GroupWithStats[]) {
	return groups.map(serializeGroup);
}

/**
 * Normaliza el nombre del grupo
 */
export function normalizeGroupName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, '-');
}
