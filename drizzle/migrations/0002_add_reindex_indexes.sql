/**
 * @file Migración para agregar campos de reindexado incremental
 * @drizzle-migration
 * @description Agrega índices y optimizaciones para el reindexado incremental basado en hash
 * @created 2025-10-11 - Sistema incremental de reindexado
 */

-- ====== IMAGES ======
-- Asegurar que el índice de hash existe y esté optimizado
CREATE INDEX IF NOT EXISTS Image_hash_idx ON Image (hash);

-- Índice compuesto para búsquedas frecuentes en reindexado
CREATE INDEX IF NOT EXISTS Image_folderId_hash_idx ON Image (folderId, hash);

-- ====== VIDEOS ======
-- Asegurar que el índice de hash existe y esté optimizado
CREATE INDEX IF NOT EXISTS Video_hash_idx ON Video (hash);

-- Índice compuesto para búsquedas frecuentes en reindexado
CREATE INDEX IF NOT EXISTS Video_folderId_hash_idx ON Video (folderId, hash);

-- ====== AUDIO ======
-- Asegurar que el índice de hash existe y esté optimizado
CREATE INDEX IF NOT EXISTS Audio_hash_idx ON Audio (hash);

-- Índice compuesto para búsquedas frecuentes en reindexado
CREATE INDEX IF NOT EXISTS Audio_folderId_hash_idx ON Audio (folderId, hash);

-- ====== DOCUMENTS ======
-- Asegurar que el índice de hash existe y está optimizado
CREATE INDEX IF NOT EXISTS Document_hash_idx ON Document (hash);

-- Índice compuesto para búsquedas frecuentes en reindexado
CREATE INDEX IF NOT EXISTS Document_folderId_hash_idx ON Document (folderId, hash);

-- ====== FILE3DS ======
-- Asegurar que el índice de hash existe y está optimizado
CREATE INDEX IF NOT EXISTS File3D_hash_idx ON File3D (hash);

-- Índice compuesto para búsquedas frecuentes en reindexado
CREATE INDEX IF NOT EXISTS File3D_folderId_hash_idx ON File3D (folderId, hash);

-- ====== UPLOADED IMAGES ======
-- Verificar si tiene campo hash, si no agregarlo
-- (Esta tabla puede no tener hash, verificar antes de aplicar)
-- CREATE INDEX IF NOT EXISTS UploadedImage_hash_idx ON UploadedImage (hash);

-- ====== JSON FILES ======
-- Verificar si tiene campo hash, si no agregarlo
-- (Esta tabla puede no tener hash, verificar antes de aplicar)
-- CREATE INDEX IF NOT EXISTS JsonFile_hash_idx ON JsonFile (hash);

-- ====== FILES ======
-- Asegurar que el índice de hash existe y está optimizado
CREATE INDEX IF NOT EXISTS File_hash_idx ON File (hash);

-- Índice compuesto para búsquedas frecuentes en reindexado
CREATE INDEX IF NOT EXISTS File_folderId_hash_idx ON File (folderId, hash);

-- ====== FOLDERS ======
-- Índice para verificar carpetas que necesitan reindexado
CREATE INDEX IF NOT EXISTS Folder_parentId_idx ON Folder (parentId);

-- ====== ANÁLISIS DE RENDIMIENTO ======
-- Ejecutar ANALYZE después de crear los índices para actualizar estadísticas
ANALYZE;

-- ====== NOTAS ======
-- 1. Los índices compuestos (folderId, hash) acelerarán las consultas de reindexado incremental
-- 2. Los índices de hash son necesarios para detectar duplicados y cambios rápidamente
-- 3. La ejecución de ANALYZE ayuda al query planner a usar los índices correctamente
-- 4. Esta migración es segura de ejecutar múltiples veces (IF NOT EXISTS)
