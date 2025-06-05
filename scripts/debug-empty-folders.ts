// 🔍 Script de diagnóstico para problema de carpetas vacías
// Ejecutar con: pnpm tsx scripts/debug-empty-folders.ts

import { getFolderImages } from '../src/app/actions/folders/get-folder-images.actions';
import { prisma } from '../src/lib/prisma';

async function debugEmptyFolders() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE CARPETAS VACÍAS');
  console.log('='.repeat(50));

  try {
    // 1️⃣ Verificar carpetas con discrepancias en conteos
    console.log('\n1️⃣ VERIFICANDO DISCREPANCIAS EN CONTEOS...');

    const foldersWithIssues = await prisma.$queryRaw<any[]>`
      SELECT
        f.id,
        f.name,
        f.path,
        (SELECT COUNT(*) FROM "Image" i WHERE i."folderId" = f.id) as real_count
      FROM "Folder" f
      WHERE EXISTS (SELECT 1 FROM "Image" i WHERE i."folderId" = f.id)
      ORDER BY real_count DESC
      LIMIT 5
    `;

    console.log(`📊 Carpetas con imágenes encontradas: ${foldersWithIssues.length}`);

    for (const folder of foldersWithIssues) {
      console.log(`\n📂 ${folder.name} (ID: ${folder.id})`);
      console.log(`   📍 Path: ${folder.path}`);
      console.log(`   🖼️ Imágenes reales: ${folder.real_count}`);

      // 2️⃣ Test directo del server action
      console.log(`\n2️⃣ TESTING SERVER ACTION: getFolderImages(${folder.id})`);

      const serverActionResult = await getFolderImages(folder.id);
      console.log(`   ✅ Server action devolvió: ${serverActionResult.length} imágenes`);

      if (serverActionResult.length > 0) {
        const first = serverActionResult[0];
        console.log(`   📄 Primera imagen: ${first.name}`);
        console.log(`   🖼️ Thumbnail: ${first.thumbnail ? '✅ Disponible' : '❌ No disponible'}`);
        console.log(`   📐 Dimensiones: ${first.width}x${first.height}`);
      }

      // 3️⃣ Verificar datos directos de BD
      console.log(`\n3️⃣ VERIFICANDO DATOS DIRECTOS EN BD...`);

      const dbImages = await prisma.image.findMany({
        where: { folderId: folder.id },
        select: {
          id: true,
          name: true,
          path: true,
          folderId: true,
          thumbnail: true,
        },
        take: 3
      });

      console.log(`   🗃️ Query directa devolvió: ${dbImages.length} imágenes`);

      if (dbImages.length > 0) {
        dbImages.forEach((img, idx) => {
          console.log(`   ${idx + 1}. ${img.name || 'Sin nombre'}`);
          console.log(`      ID: ${img.id}`);
          console.log(`      folderId: ${img.folderId}`);
          console.log(`      thumbnail: ${img.thumbnail ? '✅' : '❌'}`);
        });
      }

      console.log('\n' + '-'.repeat(40));
    }

    // 4️⃣ Verificar imágenes sin carpeta asignada
    console.log('\n4️⃣ VERIFICANDO IMÁGENES SIN CARPETA...');

    const orphanImages = await prisma.image.count({
      where: { folderId: null }
    });

    console.log(`👻 Imágenes huérfanas (sin folderId): ${orphanImages}`);

    // 5️⃣ Estadísticas generales
    console.log('\n5️⃣ ESTADÍSTICAS GENERALES...');

    const totalFolders = await prisma.folder.count();
    const totalImages = await prisma.image.count();
    const foldersWithImages = await prisma.folder.count({
      where: {
        images: {
          some: {}
        }
      }
    });

    console.log(`📂 Total carpetas: ${totalFolders}`);
    console.log(`🖼️ Total imágenes: ${totalImages}`);
    console.log(`📁 Carpetas con imágenes: ${foldersWithImages}`);
    console.log(`📭 Carpetas vacías: ${totalFolders - foldersWithImages}`);

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar diagnóstico
debugEmptyFolders()
  .then(() => {
    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
