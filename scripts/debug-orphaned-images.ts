#!/usr/bin/env tsx
/**
 * 🔍 SCRIPT DE DIAGNÓSTICO - IMÁGENES HUÉRFANAS
 *
 * Este script identifica específicamente el problema de imágenes con folderId
 * pero sin relación correcta en Prisma, causando que las carpetas aparezcan vacías.
 */

import { serverLogger } from '../src/lib/logger/server-logger';
import { prisma } from '../src/lib/prisma';

const logger = serverLogger.withContext('debug-orphaned-images');

interface OrphanDiagnostic {
  imageId: string;
  imagePath: string;
  imageSize: number;
  folderId: string | null;
  folderExists: boolean;
  folderName?: string;
  folderPath?: string;
  issue: 'no_folder_id' | 'broken_relation' | 'folder_missing' | 'healthy';
}

async function main() {
  try {
    logger.info('🔍 Iniciando diagnóstico de imágenes huérfanas...');

    console.log('\n' + '='.repeat(80));
    console.log('🚨 DIAGNÓSTICO DE IMÁGENES HUÉRFANAS - CARPETAS VACÍAS');
    console.log('='.repeat(80));

    // 1. Obtener todas las imágenes con análisis detallado
    console.log('\n📊 1. ANÁLISIS GENERAL DE IMÁGENES:');

    const totalImages = await prisma.image.count();
    const imagesWithFolderId = await prisma.image.count({
      where: { folderId: { not: null } }
    });
    const imagesWithoutFolderId = await prisma.image.count({
      where: { folderId: null }
    });

    console.log(`   📈 Total de imágenes: ${totalImages}`);
    console.log(`   📂 Con folderId: ${imagesWithFolderId}`);
    console.log(`   🚫 Sin folderId: ${imagesWithoutFolderId}`);

    // 2. Buscar imágenes con folderId pero sin relación folder válida
    console.log('\n🔍 2. BUSCANDO RELACIONES ROTAS:');

    const brokenRelationImages = await prisma.image.findMany({
      where: {
        folderId: { not: null },
        folder: null
      },
      select: {
        id: true,
        path: true,
        size: true,
        folderId: true
      },
      take: 20 // Limitar para evitar sobrecarga
    });

    console.log(`   ⚠️  Imágenes con folderId pero folder=null: ${brokenRelationImages.length}`);

    if (brokenRelationImages.length > 0) {
      console.log('\n   📋 EJEMPLOS DE RELACIONES ROTAS:');
      for (const img of brokenRelationImages.slice(0, 5)) {
        // Verificar si la carpeta realmente existe
        const folder = await prisma.folder.findUnique({
          where: { id: img.folderId! },
          select: { id: true, name: true, path: true }
        });

        console.log(`      🔸 Imagen: ${img.path}`);
        console.log(`         ID: ${img.id}`);
        console.log(`         folderId: ${img.folderId}`);
        console.log(`         Carpeta existe: ${folder ? `✅ ${folder.name} (${folder.path})` : '❌ NO'}`);
        console.log('');
      }
    }

    // 3. Buscar carpetas que deberían tener imágenes pero aparecen vacías
    console.log('\n📂 3. ANÁLISIS DE CARPETAS APARENTEMENTE VACÍAS:');

    const foldersWithDirectCount = await prisma.$queryRaw<Array<{
      folderId: string;
      directCount: number;
      folderName: string;
      folderPath: string;
    }>>`
      SELECT
        f.id as folderId,
        f.name as folderName,
        f.path as folderPath,
        COUNT(i.id) as directCount
      FROM "Folder" f
      LEFT JOIN "Image" i ON i."folderId" = f.id
      GROUP BY f.id, f.name, f.path
      HAVING COUNT(i.id) > 0
      ORDER BY COUNT(i.id) DESC
      LIMIT 10
    `;

    console.log(`   📊 Carpetas con imágenes (query directa): ${foldersWithDirectCount.length}`);

    for (const folder of foldersWithDirectCount) {
      // Verificar qué devuelve Prisma con relaciones
      const prismaCount = await prisma.image.count({
        where: { folderId: folder.folderId }
      });

      const prismaImages = await prisma.image.findMany({
        where: { folderId: folder.folderId },
        include: { folder: true },
        take: 3
      });

      console.log(`\n   📁 ${folder.folderName} (${folder.folderPath})`);
      console.log(`      🔢 Query directa: ${folder.directCount} imágenes`);
      console.log(`      🔢 Prisma count: ${prismaCount} imágenes`);
      console.log(`      🔗 Imágenes con relación: ${prismaImages.length}`);

      if (prismaImages.length > 0) {
        console.log(`      ✅ Primera imagen tiene relación: ${prismaImages[0].folder ? 'SÍ' : 'NO'}`);
      }

      // Si hay discrepancia, es el problema
      if (Number(folder.directCount) !== prismaCount) {
        console.log(`      🚨 DISCREPANCIA DETECTADA! directa=${folder.directCount} vs prisma=${prismaCount}`);
      }
    }

    // 4. Test específico: getFolderImages simulado
    console.log('\n🧪 4. TEST DE getFolderImages:');

    if (foldersWithDirectCount.length > 0) {
      const testFolder = foldersWithDirectCount[0];
      console.log(`   📂 Testeando carpeta: ${testFolder.folderName}`);

      // Simular exactamente lo que hace getFolderImages
      const images = await prisma.image.findMany({
        where: {
          folderId: testFolder.folderId,
        },
        select: {
          id: true,
          name: true,
          path: true,
          size: true,
          folderId: true,
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            }
          }
        },
        orderBy: {
          name: 'asc',
        },
      });

      console.log(`   📊 getFolderImages devolvería: ${images.length} imágenes`);

      if (images.length === 0 && Number(testFolder.directCount) > 0) {
        console.log(`   🚨 PROBLEMA CONFIRMADO: Query directa=${testFolder.directCount}, getFolderImages=0`);

        // Verificar imagen específica
        const directImage = await prisma.$queryRaw<Array<{ id: string; path: string }>>`
          SELECT id, path FROM "Image" WHERE "folderId" = ${testFolder.folderId} LIMIT 1
        `;

        if (directImage.length > 0) {
          const img = await prisma.image.findUnique({
            where: { id: directImage[0].id },
            include: { folder: true }
          });

          console.log(`   🔍 Imagen individual (${directImage[0].path}):`);
          console.log(`       folderId en BD: ${(img as any)?.folderId}`);
          console.log(`       Relación folder: ${img?.folder ? `✅ ${img.folder.name}` : '❌ NULL'}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DIAGNÓSTICO COMPLETADO');
    console.log('='.repeat(80));

    if (brokenRelationImages.length > 0) {
      console.log('\n🔧 RECOMENDACIÓN:');
      console.log('   Se detectaron relaciones rotas. Ejecutar script de reparación.');
      console.log('   Comando: npm run repair-folder-relations');
    }

  } catch (error) {
    logger.error('❌ Error en diagnóstico:', error);
    console.error('\n❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
