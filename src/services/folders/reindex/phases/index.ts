/**
 * @file Barrel export para todas las fases de reindexado
 * @module services/folders/reindex/phases
 */

export { phase1_analyzeStructure } from './phase1-analyze';
export { phase2_checkExistence } from './phase2-check-existence';
export { phase3_removeNonExistentFolders } from './phase3-remove-folders';
export { phase4_buildSubfolderStructure } from './phase4-build-structure';
export { phase5_indexFiles } from './phase5-index-files';
export { phase6_generateThumbnails } from './phase6-generate-thumbnails';
export { phase7_extractMetadata } from './phase7-extract-metadata';
export { phase8_verifyIntegrity } from './phase8-verify-integrity';
