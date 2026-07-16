/**
 * =================================================================================
 * RELATION HELPERS - DRIZZLE ORM
 * =================================================================================
 * Helpers para crear tablas de relación many-to-many de forma DRY
 * =================================================================================
 */

import { type AnySQLiteColumn, index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Crea una tabla de relación many-to-many estándar
 * @param tableName - Nombre de la tabla (ej: '_ImageToTag')
 * @param entityA - Columna primaria de la entidad A
 * @param entityB - Columna primaria de la entidad B
 * @returns Definición de tabla Drizzle
 */
export function createRelationTable(tableName: string, entityA: () => AnySQLiteColumn, entityB: () => AnySQLiteColumn) {
	return sqliteTable(
		tableName,
		{
			A: text('A').notNull().references(entityA, { onDelete: 'cascade', onUpdate: 'cascade' }),
			B: text('B').notNull().references(entityB, { onDelete: 'cascade', onUpdate: 'cascade' }),
		},
		(table) => ({
			AB_unique: uniqueIndex(`${tableName}_AB_unique`).on(table.A, table.B),
			B_index: index(`${tableName}_B_index`).on(table.B),
		})
	);
}

// Tipo para tablas de relación
export type RelationTable = ReturnType<typeof createRelationTable>;
