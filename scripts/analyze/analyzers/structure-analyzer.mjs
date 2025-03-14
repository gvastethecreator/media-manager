/**
 * Analizador de estructura del proyecto
 * @module structure-analyzer
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG, NEXTJS_CONFIG } from '../config.mjs';
import { getAllFiles, calculateDirectorySize, generateDirectoryTree, formatBytes } from '../utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analiza la estructura del proyecto
 * @returns {Promise<Object>} Resultados del análisis
 */
export async function analyzeStructure() {
  try {
    const projectRoot = path.resolve(__dirname, '../../../');
    const srcDir = path.join(projectRoot, 'src');

    // Verificar si existe el directorio src
    let srcExists = false;
    try {
      await fs.access(srcDir);
      srcExists = true;
    } catch (error) {
      // Si no existe src, usar el directorio raíz
      srcExists = false;
    }

    const rootDir = srcExists ? srcDir : projectRoot;

    // Resultados del análisis
    const structureResults = {
      directoryTree: '',
      directorySizes: {},
      fileTypes: {},
      nextjsStructure: {
        appRouter: false,
        pagesRouter: false,
        appDirs: {},
        routeFiles: [],
        apiRoutes: []
      },
      missingDirectories: [],
      recommendations: []
    };

    // Generar árbol de directorios
    structureResults.directoryTree = await generateDirectoryTree(rootDir);

    // Analizar directorios principales
    const dirs = await fs.readdir(rootDir);

    // Verificar estructura de Next.js
    const appDir = path.join(rootDir, 'app');
    const pagesDir = path.join(rootDir, 'pages');

    try {
      await fs.access(appDir);
      structureResults.nextjsStructure.appRouter = true;

      // Analizar estructura de App Router
      const appFiles = await getAllFiles(appDir);

      // Buscar archivos de rutas
      for (const file of appFiles) {
        const fileName = path.basename(file);

        if (NEXTJS_CONFIG.importantPatterns.includes(fileName)) {
          structureResults.nextjsStructure.routeFiles.push(
            path.relative(rootDir, file).replace(/\\/g, '/')
          );
        }

        // Buscar API routes
        if (fileName === 'route.ts' || fileName === 'route.js') {
          structureResults.nextjsStructure.apiRoutes.push(
            path.relative(rootDir, file).replace(/\\/g, '/')
          );
        }
      }
    } catch (error) {
      // App Router no encontrado
    }

    try {
      await fs.access(pagesDir);
      structureResults.nextjsStructure.pagesRouter = true;

      // Analizar estructura de Pages Router
      const apiDir = path.join(pagesDir, 'api');

      try {
        await fs.access(apiDir);
        const apiFiles = await getAllFiles(apiDir);

        for (const file of apiFiles) {
          structureResults.nextjsStructure.apiRoutes.push(
            path.relative(rootDir, file).replace(/\\/g, '/')
          );
        }
      } catch (error) {
        // API directory not found
      }
    } catch (error) {
      // Pages Router no encontrado
    }

    // Verificar directorios recomendados
    for (const dir of NEXTJS_CONFIG.appDirs) {
      const dirPath = path.join(rootDir, dir);

      try {
        await fs.access(dirPath);
        const size = await calculateDirectorySize(dirPath);
        structureResults.nextjsStructure.appDirs[dir] = {
          exists: true,
          size,
          sizeFormatted: formatBytes(size)
        };
      } catch (error) {
        structureResults.nextjsStructure.appDirs[dir] = {
          exists: false,
          size: 0,
          sizeFormatted: '0 B'
        };

        structureResults.missingDirectories.push(dir);
      }
    }

    // Calcular tamaños de directorios
    for (const dir of dirs) {
      const dirPath = path.join(rootDir, dir);
      const stats = await fs.stat(dirPath);

      if (stats.isDirectory() && !CONFIG.excludeDirs.includes(dir)) {
        const size = await calculateDirectorySize(dirPath);
        structureResults.directorySizes[dir] = {
          size,
          sizeFormatted: formatBytes(size)
        };
      }
    }

    // Contar tipos de archivos
    const allFiles = await getAllFiles(rootDir);

    for (const file of allFiles) {
      const ext = path.extname(file).toLowerCase();
      structureResults.fileTypes[ext] = (structureResults.fileTypes[ext] || 0) + 1;
    }

    // Generar recomendaciones
    if (!structureResults.nextjsStructure.appRouter && !structureResults.nextjsStructure.pagesRouter) {
      structureResults.recommendations.push(
        'No se detectó estructura de Next.js. Considera crear un directorio "app" para usar App Router.'
      );
    }

    if (structureResults.nextjsStructure.appRouter && structureResults.nextjsStructure.pagesRouter) {
      structureResults.recommendations.push(
        'Se detectaron tanto App Router como Pages Router. Considera migrar completamente a App Router para mejor rendimiento y características.'
      );
    }

    for (const dir of structureResults.missingDirectories) {
      structureResults.recommendations.push(
        `Considera crear un directorio "${dir}" para mejor organización del código.`
      );
    }

    return structureResults;
  } catch (error) {
    console.error('Error al analizar la estructura:', error);
    throw error;
  }
}

export default {
  analyzeStructure
};