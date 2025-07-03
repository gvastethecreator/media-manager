import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { prisma } from '../../src/lib/database/prisma';
import { db } from '../../src/lib/drizzle';
import { profiles, settings } from '../../src/lib/drizzle/schema';

/**
 * Script para comparar la estructura de datos entre Prisma y Drizzle
 */

async function comparePrismaVsDrizzle() {
  console.log('🔍 Comparando estructura Prisma vs Drizzle...\n');

  try {
    // 1. Obtener perfil activo con Prisma
    console.log('1️⃣ Obteniendo perfil activo con Prisma...');
    const prismaProfile = await prisma.profile.findFirst({
      where: { isActive: true },
      include: {
        settings: true,
      },
    });

    console.log('📊 Estructura Prisma:');
    console.log(JSON.stringify(prismaProfile, null, 2));
    console.log('');

    // 2. Obtener perfil activo con Drizzle
    console.log('2️⃣ Obteniendo perfil activo con Drizzle...');
    const drizzleProfile = await db.select({
      // Campos del perfil
      id: profiles.id,
      name: profiles.name,
      emoji: profiles.emoji,
      color: profiles.color,
      description: profiles.description,
      isActive: profiles.isActive,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
      settingsId: profiles.settingsId,
      imageId: profiles.imageId,
      // Campos de settings
      settingsData: settings.data,
      settingsTheme: settings.theme,
      settingsLanguage: settings.language,
    })
      .from(profiles)
      .leftJoin(settings, eq(profiles.settingsId, settings.id))
      .where(eq(profiles.isActive, true))
      .limit(1);

    const drizzleResult = drizzleProfile.length > 0 ? drizzleProfile[0] : null;

    console.log('📊 Estructura Drizzle (raw):');
    console.log(JSON.stringify(drizzleResult, null, 2));
    console.log('');

    // 3. Analizar diferencias
    console.log('3️⃣ Análisis de diferencias...');

    if (prismaProfile && drizzleResult) {
      console.log('🔍 Campos en Prisma que faltan en Drizzle:');

      // Verificar si Prisma tiene settings anidados
      if (prismaProfile.settings) {
        console.log(`   - settings.id: ${prismaProfile.settings.id}`);
        console.log(`   - settings.theme: ${prismaProfile.settings.theme}`);
        console.log(`   - settings.language: ${prismaProfile.settings.language}`);
        console.log(`   - settings.data: ${JSON.stringify(prismaProfile.settings.data)}`);
      } else {
        console.log('   - settings: null');
      }

      console.log('');
      console.log('🔍 Campos en Drizzle:');
      console.log(`   - settingsTheme: ${drizzleResult.settingsTheme}`);
      console.log(`   - settingsLanguage: ${drizzleResult.settingsLanguage}`);
      console.log(`   - settingsData: ${drizzleResult.settingsData}`);
    }

    console.log('\n🎯 Conclusión:');
    console.log('   - Prisma devuelve settings como objeto anidado');
    console.log('   - Drizzle devuelve campos planos del JOIN');
    console.log('   - Necesito restructurar Drizzle para coincidir con Prisma');

  } catch (error) {
    console.error('❌ Error durante la comparación:', error);
  }
}

// Ejecutar comparación
comparePrismaVsDrizzle();