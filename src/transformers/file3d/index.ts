// Barrel de transformers para File3D

// Exportar desde mappers (renombrando la función conflictiva)
export {
	fromPrismaFile3D as mapFile3DFromPrisma,
	toPrismaFile3D,
} from './mappers';

// Exportar desde serializers
export * from './serializers';

// Exportar desde transformer
export {
	fromPrismaFile3D,
	fromPrismaFile3Ds,
} from './transformer';
