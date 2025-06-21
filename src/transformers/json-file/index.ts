// Barrel de transformers para JsonFile

// Exportar desde mappers (renombrando la función conflictiva)
export {
    fromPrismaJsonFile as mapJsonFileFromPrisma,
    toPrismaJsonFile
} from './mappers';

// Exportar desde serializers
export * from './serializers';

// Exportar desde transformer
export {
    fromPrismaJsonFile,
    fromPrismaJsonFiles
} from './transformer';

