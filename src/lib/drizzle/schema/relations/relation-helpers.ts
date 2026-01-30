/**
 * =================================================================================
 * RELATION HELPERS - DRIZZLE ORM
 * =================================================================================
 * Helpers para crear tablas de relación many-to-many de forma DRY
 * =================================================================================
 */

import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Crea una tabla de relación many-to-many estándar
 * @param tableName - Nombre de la tabla (ej: '_ImageToTag')
 * @param entityAName - Nombre de la entidad A (para comentarios)
 * @param entityBName - Nombre de la entidad B (para comentarios)
 * @returns Definición de tabla Drizzle
 */
export function createRelationTable(tableName: string, entityAName: string, entityBName: string) {
	return sqliteTable(
		tableName,
		{
			A: text('A').notNull(), // ID de entidad A
			B: text('B').notNull(), // ID de entidad B
		},
		(table) => ({
			AB_unique: uniqueIndex(`${tableName}_AB_unique`).on(table.A, table.B),
			B_index: index(`${tableName}_B_index`).on(table.B),
		})
	);
}

// Tipo para tablas de relación
export type RelationTable = ReturnType<typeof createRelationTable>;
