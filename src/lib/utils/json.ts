/**
 * @file Utilidades para trabajar con JSON de forma segura.
 * @module lib/utils/json
 */

/**
 * Parsea de forma segura una cadena JSON.
 * Si la cadena es nula, indefinida o el parseo falla, devuelve un valor por defecto.
 *
 * @template T - El tipo esperado del objeto parseado.
 * @param {string | null | undefined} jsonString - La cadena JSON a parsear.
 * @param {T} defaultValue - El valor a devolver si el parseo falla.
 * @returns {T} El objeto parseado o el valor por defecto.
 *
 * @example
 * const data = safeJsonParse('{"a": 1}', { a: 0 }); // devuelve { a: 1 }
 * const dataWithError = safeJsonParse('not a json', { a: 0 }); // devuelve { a: 0 }
 * const dataNull = safeJsonParse(null, []); // devuelve []
 */
export function safeJsonParse<T>(
  jsonString: string | null | undefined,
  defaultValue: T,
): T {
  if (!jsonString) {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Failed to parse JSON string:', error);
    return defaultValue;
  }
}