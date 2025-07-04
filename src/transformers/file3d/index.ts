/**
 * @file Punto de entrada para transformadores de File3D
 * @module transformers/file3d
 */

// Exportar desde mappers (solo Drizzle, sin alias Prisma)
export {
	fromDrizzleFile3D as mapFile3DFromDrizzle, // Mapeo simple
	toDrizzleFile3D as mapFile3DToDrizzle, // Mapeo simple
} from './mappers';

// Exportar desde serializers
export * from './serializers';

// Exportar desde transformer (estas son las funciones de transformación principales)
export {
	fromDrizzleFile3D, // Transforma a File3DWithStats
	fromDrizzleFile3Ds,
} from './transformer';
