// Barrel de transformers para File3D

// Exportar desde mappers (renombrando la función conflictiva)
export {
	fromDrizzleFile3D as mapFile3DFromDrizzle,
	toPrismaFile3D,
} from './mappers';

// Exportar desde serializers
export * from './serializers';

// Exportar desde transformer
export {
	fromDrizzleFile3D,
	fromDrizzleFile3Ds,
} from './transformer';
