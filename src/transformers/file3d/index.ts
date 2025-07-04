/**
 * @file Punto de entrada para transformadores de File3D
 * @module transformers/file3d
 */

// Exportar desde mappers (renombrando para evitar conflictos)
export {
	fromDrizzleFile3D as mapFile3DFromDrizzle, // Mapeo simple
	toDrizzleFile3D as mapFile3DToDrizzle,     // Mapeo simple
	toPrismaFile3D,                             // Alias deprecated por compatibilidad
} from './mappers';

// Exportar desde serializers
export * from './serializers';

// Exportar desde transformer (estas son las funciones de transformación principales)
export {
	fromDrizzleFile3D, // Transforma a File3DWithStats
	fromDrizzleFile3Ds,
} from './transformer';
