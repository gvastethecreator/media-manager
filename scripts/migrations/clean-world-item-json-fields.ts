// 🧹 Script de migración para limpiar campos JSON corruptos en WorldItem
// filepath: d:\DEV\image-manager\scripts\migrations\clean-world-item-json-fields.ts

import { serverLogger } from '@/lib/logger/server-logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CleanupStats {
	totalRecords: number;
	fixedRecords: number;
	errors: number;
	fieldsFixed: {
		attributes: number;
		effects: number;
		stats: number;
		requirements: number;
		filters: number;
	};
}

/**
 * 🔧 Normaliza strings comunes a valores JSON válidos
 */
function normalizeCommonStrings(field: string): string | null {
	const trimmed = field.trim().toLowerCase();

	// Casos de "ningún valor" o "vacío"
	if (['ninguno', 'none', 'null', 'vacio', 'vacío', 'empty', 'n/a', 'na', '-'].includes(trimmed)) {
		return '[]'; // Array vacío por defecto
	}

	// Casos de objetos vacíos
	if (['{}', 'objeto vacio', 'objeto vacío', 'no hay'].includes(trimmed)) {
		return '{}';
	}

	return null; // No se pudo normalizar
}

/**
 * 🔧 Repara patrones de atributos tipo "Fuerza 15"
 */
function repairAttributePattern(field: string): string | null {
	// Detectar patrones como "Fuerza 15", "Fuerza 15, Destreza 10", etc.
	const attributePattern = /^[A-Za-zÀ-ÿ\s]+\s+\d+/;
	if (!attributePattern.test(field)) return null;

	try {
		const items = field.split(',')
			.map(item => item.trim())
			.filter(Boolean)
			.map(item => {
				// Buscar patrón: "Nombre + Número + (opcional) descripción"
				const matches = item.match(/^([A-Za-zÀ-ÿ\s]+?)\s+(\d+)(.*)$/);
				if (matches) {
					return {
						name: matches[1].trim(),
						value: Number.parseInt(matches[2], 10),
						description: matches[3]?.trim() || ''
					};
				}

				// Fallback: considerar todo como nombre
				return { name: item, value: 0, description: '' };
			});

		return JSON.stringify(items);
	} catch (error) {
		serverLogger.error(`❌ Error al reparar patrón de atributos: ${field}`, error);
		return null;
	}
}

/**
 * 🧹 Limpia un campo JSON específico
 */
function cleanJsonField(field: string | null, fieldName: string, defaultValue: string = '[]'): { value: string; wasFixed: boolean } {
	if (!field || field === 'null' || field === 'undefined') {
		return { value: defaultValue, wasFixed: true };
	}

	// Si ya es JSON válido, no tocar
	try {
		JSON.parse(field);
		return { value: field, wasFixed: false };
	} catch (originalError) {		serverLogger.debug(`🔄 Intentando reparar campo ${fieldName}: "${field.substring(0, 50)}${field.length > 50 ? '...' : ''}"`);

		// 🔧 Estrategia 1: Normalizar strings comunes
		const normalized = normalizeCommonStrings(field);
		if (normalized) {
			try {
				JSON.parse(normalized);
				serverLogger.info(`✅ Campo ${fieldName} reparado con normalización: "${field}" → ${normalized}`);
				return { value: normalized, wasFixed: true };
			} catch (error) {
				serverLogger.error(`❌ Error al parsear campo normalizado: ${normalized}`, error);
			}
		}

		// 🔧 Estrategia 2: Reparar patrones de atributos (solo para attributes y similar)
		if (['attributes', 'effects', 'requirements', 'stats'].includes(fieldName)) {
			const repairedAttribute = repairAttributePattern(field);
			if (repairedAttribute) {
				try {
					JSON.parse(repairedAttribute);
					logger.info(`✅ Campo ${fieldName} reparado como atributos: "${field}" → ${repairedAttribute}`);
					return { value: repairedAttribute, wasFixed: true };
				} catch (error) {
					logger.error(`❌ Error al parsear atributos reparados: ${repairedAttribute}`, error);
				}
			}
		}

		// 🔧 Estrategia 3: Intentar envolver en array si parece ser un elemento único
		if (field.length > 0 && !field.startsWith('[') && !field.startsWith('{')) {
			try {
				// Envolver en array como string
				const wrappedAsArray = `["${field.replace(/"/g, '\\"')}"]`;
				JSON.parse(wrappedAsArray);
				logger.info(`✅ Campo ${fieldName} envuelto en array: "${field}" → ${wrappedAsArray}`);
				return { value: wrappedAsArray, wasFixed: true };
			} catch (error) {
				logger.debug(`❌ No se pudo envolver en array: ${field}`, error);
			}
		}

		// 🚨 Si todas las estrategias fallan, usar valor por defecto
		logger.warn(`❌ No se pudo reparar campo ${fieldName}. Campo: "${field}", Error original: ${originalError}. Usando valor por defecto: ${defaultValue}.`);
		return { value: defaultValue, wasFixed: true };
	}
}

/**
 * 🧹 Migración principal para limpiar WorldItem
 */
async function cleanWorldItemJsonFields(): Promise<CleanupStats> {
	const stats: CleanupStats = {
		totalRecords: 0,
		fixedRecords: 0,
		errors: 0,
		fieldsFixed: {
			attributes: 0,
			effects: 0,
			stats: 0,
			requirements: 0,
			filters: 0
		}
	};

	try {
		logger.info('🧹 Iniciando limpieza de campos JSON en WorldItem...');

		// Obtener todos los WorldItems
		const worldItems = await prisma.worldItem.findMany({
			select: {
				id: true,
				name: true,
				attributes: true,
				effects: true,
				stats: true,
				requirements: true,
				filters: true
			}
		});

		stats.totalRecords = worldItems.length;
		logger.info(`📊 Total de registros a procesar: ${stats.totalRecords}`);

		// Procesar cada WorldItem
		for (const item of worldItems) {
			try {
				const updates: any = {};
				let itemFixed = false;

				// Limpiar cada campo JSON
				const attributesResult = cleanJsonField(item.attributes, 'attributes');
				if (attributesResult.wasFixed) {
					updates.attributes = attributesResult.value;
					stats.fieldsFixed.attributes++;
					itemFixed = true;
				}

				const effectsResult = cleanJsonField(item.effects, 'effects');
				if (effectsResult.wasFixed) {
					updates.effects = effectsResult.value;
					stats.fieldsFixed.effects++;
					itemFixed = true;
				}

				const statsResult = cleanJsonField(item.stats, 'stats', '{}');
				if (statsResult.wasFixed) {
					updates.stats = statsResult.value;
					stats.fieldsFixed.stats++;
					itemFixed = true;
				}

				const requirementsResult = cleanJsonField(item.requirements, 'requirements', '{}');
				if (requirementsResult.wasFixed) {
					updates.requirements = requirementsResult.value;
					stats.fieldsFixed.requirements++;
					itemFixed = true;
				}

				const filtersResult = cleanJsonField(item.filters, 'filters');
				if (filtersResult.wasFixed) {
					updates.filters = filtersResult.value;
					stats.fieldsFixed.filters++;
					itemFixed = true;
				}

				// Actualizar si hay cambios
				if (itemFixed) {
					await prisma.worldItem.update({
						where: { id: item.id },
						data: updates
					});
					stats.fixedRecords++;
					logger.debug(`✅ WorldItem "${item.name}" (${item.id}) actualizado`);
				}

			} catch (error) {
				stats.errors++;
				logger.error(`❌ Error procesando WorldItem "${item.name}" (${item.id}):`, error);
			}
		}

		logger.info('🎉 Limpieza de campos JSON completada exitosamente!');
		logger.info('📊 Estadísticas de limpieza:', {
			'Total registros': stats.totalRecords,
			'Registros corregidos': stats.fixedRecords,
			'Errores': stats.errors,
			'Campos corregidos': {
				'Attributes': stats.fieldsFixed.attributes,
				'Effects': stats.fieldsFixed.effects,
				'Stats': stats.fieldsFixed.stats,
				'Requirements': stats.fieldsFixed.requirements,
				'Filters': stats.fieldsFixed.filters
			}
		});

		return stats;

	} catch (error) {
		logger.error('❌ Error durante la migración:', error);
		stats.errors++;
		throw error;
	}
}

/**
 * 🔍 Función para verificar los resultados
 */
async function verifyCleanup(): Promise<void> {
	logger.info('🔍 Verificando resultados de la limpieza...');

	const problematicItems = await prisma.$queryRaw`
		SELECT id, name, attributes, effects, stats, requirements, filters
		FROM WorldItem
		WHERE
			(attributes NOT LIKE '[%' AND attributes NOT LIKE '{%' AND attributes != 'empty_array' AND attributes != '[]') OR
			(effects NOT LIKE '[%' AND effects NOT LIKE '{%' AND effects != 'empty_array' AND effects != '[]') OR
			(stats NOT LIKE '[%' AND stats NOT LIKE '{%' AND stats != '' AND stats != '{}') OR
			(requirements NOT LIKE '[%' AND requirements NOT LIKE '{%' AND requirements != '' AND requirements != '{}') OR
			(filters NOT LIKE '[%' AND filters NOT LIKE '{%' AND filters != 'empty_array' AND filters != '[]')
		LIMIT 10
	`;

	if (Array.isArray(problematicItems) && problematicItems.length > 0) {
		logger.warn(`⚠️  Aún hay ${problematicItems.length} registros con posibles problemas:`, problematicItems);
	} else {
		logger.info('✅ Verificación completada: No se encontraron más problemas JSON');
	}
}

/**
 * 🚀 Ejecutar la migración si se llama directamente
 */
if (require.main === module) {
	cleanWorldItemJsonFields()
		.then(async (stats) => {
			await verifyCleanup();
			await prisma.$disconnect();
			process.exit(0);
		})
		.catch(async (error) => {
			logger.error('💥 Error fatal en la migración:', error);
			await prisma.$disconnect();
			process.exit(1);
		});
}

export { cleanWorldItemJsonFields, verifyCleanup };
