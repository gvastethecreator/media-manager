import 'dotenv/config';
import { prisma } from '../../src/lib/database/prisma';

/**
 * Script para entender la estructura exacta que devuelve Prisma
 *
 * Ejecución: tsx scripts/db/debug-prisma-structure.ts
 */

async function debugPrismaStructure() {
  console.log('🔍 Analizando estructura de datos de Prisma...\n');

  try {
    // 1. Obtener perfil activo con include settings
    console.log('1️⃣ Perfil activo con include settings...');
    const profileWithSettings = await prisma.profile.findFirst({
      where: { isActive: true },
      include: { settings: true },
    });

    if (profileWithSettings) {
      console.log('✅ Estructura completa:');
      console.log(JSON.stringify(profileWithSettings, null, 2));
      console.log('');

      console.log('📊 Campos principales:');
      console.log(`   - id: ${profileWithSettings.id}`);
      console.log(`   - name: ${profileWithSettings.name}`);
      console.log(`   - settingsId: ${profileWithSettings.settingsId}`);
      console.log(`   - settings existe: ${!!profileWithSettings.settings}`);

      if (profileWithSettings.settings) {
        console.log(`   - settings.theme: ${profileWithSettings.settings.theme}`);
        console.log(`   - settings.language: ${profileWithSettings.settings.language}`);
        console.log(`   - settings.data: ${typeof profileWithSettings.settings.data}`);
      }
      console.log('');
    } else {
      console.log('❌ No se encontró perfil activo');
    }

    // 2. Obtener perfil sin include (como viene por defecto)
    console.log('2️⃣ Perfil activo sin include...');
    const profileWithoutSettings = await prisma.profile.findFirst({
      where: { isActive: true },
    });

    if (profileWithoutSettings) {
      console.log('✅ Estructura sin include:');
      console.log(JSON.stringify(profileWithoutSettings, null, 2));
      console.log('');
    }

    // 3. Comparar tipos
    console.log('3️⃣ Análisis de tipos...');
    if (profileWithSettings) {
            console.log('📋 Campos en profile:');
      for (const key of Object.keys(profileWithSettings)) {
        const value = (profileWithSettings as any)[key];
        console.log(`   - ${key}: ${typeof value} ${Array.isArray(value) ? '(array)' : ''}`);
      }

      if (profileWithSettings.settings) {
        console.log('');
        console.log('📋 Campos en settings:');
        for (const key of Object.keys(profileWithSettings.settings)) {
          const value = (profileWithSettings.settings as any)[key];
          console.log(`   - ${key}: ${typeof value} ${Array.isArray(value) ? '(array)' : ''}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  }
}

// Ejecutar análisis
debugPrismaStructure();