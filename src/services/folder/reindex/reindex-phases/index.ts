/**
 * @file Índice de fases de reindexado
 * @description Exporta todas las fases del proceso de reindexado
 */

export { phase1_analyzeStructure } from './phase1-analyze';
export { phase2_checkExistence } from './phase2-existence';
export { phase3_removeNonExistentFolders } from './phase3-deletion';
export { phase4_buildSubfolderStructure } from './phase4-structure';
export { phase5_indexFiles } from './phase5-indexing';
export { phase6_generateThumbnails } from './phase6-thumbnails';
export { phase7_extractMetadata } from './phase7-metadata';
export { phase8_verifyIntegrity } from './phase8-verification';
