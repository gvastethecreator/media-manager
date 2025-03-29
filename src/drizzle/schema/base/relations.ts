import { primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';

/**
 * Crea una tabla de relación muchos a muchos
 * @param name Nombre de la tabla
 * @param table1 Nombre de la primera tabla
 * @param table2 Nombre de la segunda tabla
 */
export const createRelationTable = (name: string, table1: string, table2: string) => {
    const tableName = `${table1}To${table2}`;
    return sqliteTable(
        tableName,
        {
            [`${table1.toLowerCase()}Id`]: text(`${table1.toLowerCase()}Id`).notNull(),
            [`${table2.toLowerCase()}Id`]: text(`${table2.toLowerCase()}Id`).notNull(),
        },
        (table) => ({
            pk: primaryKey({
                columns: [
                    table[`${table1.toLowerCase()}Id`],
                    table[`${table2.toLowerCase()}Id`]
                ]
            }),
        })
    );
};

/**
 * Crea índices comunes para una tabla
 * @param table Tabla a la que se agregarán los índices
 */
export const createCommonIndexes = (table: any) => ({
    nameIdx: primaryKey({ columns: [table.name] }),
    categoryIdx: primaryKey({ columns: [table.category] }),
    createdAtIdx: primaryKey({ columns: [table.createdAt] }),
});