/**
 * @file Funciones auxiliares para cálculos de grupos
 * @module services/group/utils
 */

/**
 * Calcula el nivel de rareza del grupo basado en su contenido
 */
export function calculateRarityLevel(totalEntities: number, filtersCount: number): number {
	// Base: 1-10, donde 10 es lo más raro
	let rarityScore = 1;

	// Factores que aumentan rareza:
	// 1. Gran cantidad de entidades
	if (totalEntities > 100) {
		rarityScore += 3;
	} else if (totalEntities > 50) {
		rarityScore += 2;
	} else if (totalEntities > 20) {
		rarityScore += 1;
	}

	// 2. Filtros complejos
	rarityScore += Math.min(3, Math.floor(filtersCount / 2));

	return Math.min(10, rarityScore);
}

/**
 * Calcula el poder de un grupo basado en sus atributos
 */
export function calculateGroupPower(group: any, totalEntities: number, filtersCount: number): number {
	// Base de poder
	let power = 50;

	// Bonificación por entidades
	power += totalEntities * 2;

	// Bonificación por filtros complejos
	power += filtersCount * 10;

	// Bonificación por ser favorito
	if (group.isFavorite) {
		power += 25;
	}

	// Limitar el poder máximo
	return Math.min(999, power);
}

/**
 * Calcula los puntos de salud basados en la diversidad de entidades
 */
export function calculateHealth(counts: any): number {
	// Base HP
	let hp = 100;

	// Validación null-safe para evitar errores de Object.entries
	if (!counts || typeof counts !== 'object') {
		console.warn('⚠️ [GROUP-SERVICE] calculateHealth recibió counts null/undefined, usando valores por defecto');
		return hp;
	}

	// Contar tipos diferentes de entidades presentes
	const entityTypes = Object.entries(counts).filter(([_, count]) => (count as number) > 0).length;

	// Bonificación por diversidad
	hp += entityTypes * 20;

	// Bonificación por volumen total de entidades principales
	const mainEntities =
		(counts.characters || 0) + (counts.places || 0) + (counts.worldItems || 0) + (counts.concepts || 0);
	hp += mainEntities * 5;

	return Math.min(999, hp);
}

/**
 * Calcula los puntos de maná (MP) basados en filtros y flexibilidad
 */
export function calculateMana(filtersCount: number, category: string | null): number {
	// Base MP
	let mp = 60;

	// Bonificación por filtros (representa "opciones mágicas")
	mp += filtersCount * 15;

	// Bonificación por categoría especializada
	if (category && category !== 'general') {
		mp += 25;
	}

	return Math.min(999, mp);
}

/**
 * Calcula el nivel de organización basado en contenedores vs items
 */
export function calculateOrganizationLevel(counts: any): number {
	// Nivel básico: 1-10
	const totalAlbumCollections = counts.albums + counts.collections;
	const totalItems = counts.images + counts.videos;

	if (totalItems === 0) {
		return 1;
	}

	// Relación de organización: cuántos contenedores (albums/colecciones) por item
	const ratio = totalAlbumCollections / totalItems;

	// Convertir ratio a escala 1-10
	return Math.min(10, Math.max(1, Math.round(ratio * 20) + 1));
}

/**
 * Determina el tipo de organización basado en el tipo predominante de entidades
 */
export function determineOrganizationType(counts: any): string {
	const media = counts.images + counts.videos;
	const collections = counts.albums + counts.collections;
	const worldBuilding = counts.characters + counts.places + counts.worldItems + counts.concepts;
	const utility = counts.notes + counts.prompts + counts.wildcards + counts.properties;

	const max = Math.max(media, collections, worldBuilding, utility);

	if (max === media) {
		return 'Archivo';
	}
	if (max === collections) {
		return 'Colección';
	}
	if (max === worldBuilding) {
		return 'Mundo';
	}
	if (max === utility) {
		return 'Utilidad';
	}

	return 'Mixto';
}
