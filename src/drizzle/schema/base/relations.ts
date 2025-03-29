import { relations } from 'drizzle-orm';
import { index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Tipos para relaciones
export type RelationBuilder<TTableName extends string> = ReturnType<typeof relations<TTableName>>;
export type ManyToMany<T> = { through: T };
export type OneToOne<T, TField extends any[], TRef extends any[]> = { fields: TField; references: TRef };

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
 * Helper para crear índices comunes para una tabla
 * @param tableName Nombre base para los índices
 * @param columnName1 Nombre de la columna para el primer índice
 * @param columnName2 Nombre de la columna para el segundo índice
 * @param columnName3 Nombre de la columna para el tercer índice
 */
export const createIndexes = (
    tableName: string,
    columnName1 = "name",
    columnName2 = "category",
    columnName3 = "createdAt"
) => {
    return {
        [`${columnName1}Idx`]: index(`${tableName}_${columnName1}_idx`),
        [`${columnName2}Idx`]: index(`${tableName}_${columnName2}_idx`),
        [`${columnName3}Idx`]: index(`${tableName}_${columnName3}_idx`),
    };
};

/**
 * Función para crear relaciones a partir de tablas intermedias
 * Esta función se utiliza internamente para simplificar la definición de relaciones
 */
export { relations };

/**
 * Crea un objeto de relaciones para una tabla
 * @param tableName Nombre de la tabla
 * @param entities Entidades relacionadas
 */
export function createManyToManyRelations(entities: Record<string, any>) {
    return function relationBuilder({ many }: any) {
        const relations: Record<string, any> = {};
        for (const [key, entity] of Object.entries(entities)) {
            relations[key] = many(entity);
        }
        return relations;
    };
}