/**
 * @file Utilidad para calcular la completitud de datos de una entidad.
 * @module utils/transformers/calculate-completeness
 */

/**
 * Calcula un score de completitud basado en los campos proporcionados.
 * El score es un porcentaje (0-100) que representa cuántos de los campos tienen un valor "significativo".
 *
 * Se consideran "vacíos" los siguientes valores:
 * - null
 * - undefined
 * - '' (string vacío)
 * - [] (array vacío)
 * - {} (objeto vacío)
 *
 * @param fields - Un array de valores de cualquier tipo.
 * @returns {number} Un número entero entre 0 y 100.
 *
 * @example
 * const score = calculateCompleteness(['hello', 'world', null, '']); // 50
 * const fullScore = calculateCompleteness(['a', 1, true]); // 100
 * const emptyScore = calculateCompleteness([null, undefined, '']); // 0
 */
export function calculateCompleteness(fields: unknown[]): number;

/**
 * Calcula un score de completitud basado en los campos especificados de un objeto.
 *
 * @param obj - El objeto del cual extraer los valores
 * @param fieldNames - Array de nombres de campos a evaluar
 * @returns {number} Un número entero entre 0 y 100.
 *
 * @example
 * const entity = { name: 'Test', description: '', category: 'A' };
 * const score = calculateCompleteness(entity, ['name', 'description', 'category']); // 67
 */
export function calculateCompleteness(obj: Record<string, unknown>, fieldNames: string[]): number;

export function calculateCompleteness(
  fieldsOrObj: unknown[] | Record<string, unknown>,
  fieldNames?: string[]
): number {
  // Si es un array directo (primera sobrecarga)
  if (Array.isArray(fieldsOrObj)) {
    const fields = fieldsOrObj;
    if (fields.length === 0) {
      return 100; // Si no se esperan campos, está 100% completo.
    }

    const filledCount = fields.filter(field => {
      if (field === null || field === undefined) {
        return false;
      }
      if (typeof field === 'string' && field.trim() === '') {
        return false;
      }
      if (Array.isArray(field) && field.length === 0) {
        return false;
      }
      if (typeof field === 'object' && Object.keys(field).length === 0) {
        return false;
      }
      return true;
    }).length;

    return Math.round((filledCount / fields.length) * 100);
  }

  // Si es un objeto con fieldNames (segunda sobrecarga)
  if (fieldNames && fieldNames.length > 0) {
    const values = fieldNames.map(fieldName => fieldsOrObj[fieldName]);
    return calculateCompleteness(values);
  }

  // Fallback: objeto vacío o sin fieldNames
  return 100;
}