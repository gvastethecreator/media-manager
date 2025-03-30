/**
 * @file Exporta los componentes principales para el transformer de Wildcard
 * @module transformers/wildcard
 */

// Exportar todas las funciones de serialización
export * from './serializers';

// Exportar todas las funciones de mapeo
export * from './mappers';
export { fromPrismaWildcard as transformWildcard };

// Alias de función principal para facilitar su uso
import { fromPrismaWildcard } from './serializers';

