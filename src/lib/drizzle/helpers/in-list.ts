import { type SQL, sql } from 'drizzle-orm';

/**
 * Construye una cláusula IN segura parametrizada.
 * Devuelve objeto con fragmento SQL y valores en el mismo orden.
 * Si la lista está vacía devuelve fragmento que siempre es falso (1=0) para evitar SQL inválido.
 */
export function buildInList<T extends string | number>(column: SQL, values: T[]): { clause: SQL; params: T[] } {
	if (!values.length) {
		return { clause: sql`1=0`, params: [] };
	}
	// Interpolación segura; Drizzle escapa cada literal.
	const clause = sql`${column} IN (${sql.join(
		values.map((v) => sql`${v}`),
		sql`, `
	)})`;
	return { clause, params: values };
}
