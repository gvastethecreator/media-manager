import { ALL_ENTITIES, ENTITY_DISPLAY_NAMES, type EntityType } from '@/constants/entities';
import { serverLogger } from './logger/server-logger';

// Logger para las utilidades de entidades
const entityUtilsLogger = serverLogger.withContext('EntityUtils');

/**
 * Verifica si todas las entidades especificadas están cargadas
 *
 * @param entities Lista de entidades a verificar
 * @param stores Objeto con los stores de entidades
 * @returns Objeto con el resultado de la verificación
 */
export function areEntitiesLoaded(
	entities: EntityType[],
	stores: Record<string, any>
): {
	allLoaded: boolean;
	loadedCount: number;
	totalCount: number;
	loadedEntities: EntityType[];
	pendingEntities: EntityType[];
} {
	let loadedCount = 0;
	const loadedEntities: EntityType[] = [];
	const pendingEntities: EntityType[] = [];

	for (const entity of entities) {
		const storeKey = entity.toLowerCase();

		// Verificar si el store existe y tiene datos
		if (
			storeKey in stores &&
			stores[storeKey] &&
			stores[storeKey][storeKey] &&
			Array.isArray(stores[storeKey][storeKey]) &&
			stores[storeKey][storeKey].length > 0
		) {
			loadedCount++;
			loadedEntities.push(entity);
		} else {
			pendingEntities.push(entity);
		}
	}

	return {
		allLoaded: loadedCount === entities.length,
		loadedCount,
		totalCount: entities.length,
		loadedEntities,
		pendingEntities,
	};
}

/**
 * Genera un informe del estado de carga de las entidades
 *
 * @param result Resultado de la función areEntitiesLoaded
 * @returns String con un informe amigable
 */
export function generateLoadingReport(result: ReturnType<typeof areEntitiesLoaded>): string {
	const { allLoaded, loadedCount, totalCount, loadedEntities, pendingEntities } = result;

	const percentage = Math.round((loadedCount / totalCount) * 100);

	let report = `Estado de carga de entidades: ${percentage}% (${loadedCount}/${totalCount})`;

	if (allLoaded) {
		report += '\n✅ Todas las entidades están cargadas.';
	} else {
		report += `\n⏳ Entidades cargadas: ${loadedEntities.map((e) => ENTITY_DISPLAY_NAMES[e]).join(', ')}`;
		report += `\n⌛ Entidades pendientes: ${pendingEntities.map((e) => ENTITY_DISPLAY_NAMES[e]).join(', ')}`;
	}

	return report;
}

/**
 * Registra un informe del estado de carga de las entidades
 *
 * @param result Resultado de la función areEntitiesLoaded
 */
export function logLoadingStatus(result: ReturnType<typeof areEntitiesLoaded>): void {
	const report = generateLoadingReport(result);

	if (result.allLoaded) {
		entityUtilsLogger.info(report);
	} else {
		entityUtilsLogger.warn(report);
	}
}
