import type { Group } from '@prisma/client';

/**
 * 🗿 Modelo base de Group, tal como viene de Prisma.
 */
export type GroupBase = Group;

/**
 * 📊 Estadísticas calculadas y derivadas para un Group.
 * Principalmente, los conteos de las relaciones.
 */
export interface GroupStatistics {
	imageCount: number;
	videoCount: number;
	albumCount: number;
	collectionCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	worldItemCount: number;
	conceptCount: number;
	promptCount: number;
	noteCount: number;
	wildcardCount: number;
	propertyCount: number;
}

/**
 * ✨ Modelo extendido de Group con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface GroupWithStats extends GroupBase {
	stats: GroupStatistics;
}

