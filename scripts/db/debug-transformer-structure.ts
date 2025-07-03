import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../../src/lib/drizzle';
import { profiles, settings } from '../../src/lib/drizzle/schema';
import { transformProfile } from '../../src/transformers/profile/profile-transformers';

/**
 * Script para entender qué estructura espera el transformador
 * y cómo arreglar el mapeo de datos
 *
 * Ejecución: tsx scripts/db/debug-transformer-structure.ts
 */

async function debugTransformerStructure() {
  console.log('🔍 Analizando estructura esperada por el transformador...\n');

  try {
    // 1. Obtener datos con Drizzle (como está ahora)
    console.log('1️⃣ Datos actuales de Drizzle...');
    const drizzleData = await db.select({
      // Profile fields
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
      // Settings fields (flat)
      settingsRealId: settings.id,
      settingsData: settings.data,
      settingsTheme: settings.theme,
      settingsLanguage: settings.language,
    })
      .from(profiles)
      .leftJoin(settings, eq(settings.profileId, profiles.id)) // Usar relación inversa
      .where(eq(profiles.isActive, true))
      .limit(1);

    if (drizzleData.length === 0) {
      console.log('❌ No se encontró perfil activo');
      return;
    }

    const raw = drizzleData[0];
    console.log('✅ Datos de Drizzle (flat):');
    console.log(JSON.stringify(raw, null, 2));
    console.log('');

    // 2. Estructura actual (como la estoy creando)
    console.log('2️⃣ Estructura actual (como la creo para el transformador)...');
    const currentStructure = {
      id: raw.id,
      name: raw.name,
      emoji: raw.emoji,
      color: raw.color,
      description: raw.description,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      settingsId: raw.settingsId,
      imageId: raw.imageId,
      // Settings como objeto anidado
      settings: raw.settingsRealId ? {
        id: raw.settingsRealId,
        theme: raw.settingsTheme,
        language: raw.settingsLanguage,
        data: raw.settingsData,
        profileId: raw.id,
      } : null,
    };

    console.log('📋 Estructura actual:');
    console.log(JSON.stringify(currentStructure, null, 2));
    console.log('');

    // 3. Probar el transformador con la estructura actual
    console.log('3️⃣ Probando transformador con estructura actual...');
    try {
      const transformed = transformProfile(currentStructure as any);
      console.log('✅ Transformación exitosa:');
      console.log(`   - ID: ${transformed.id}`);
      console.log(`   - Name: ${transformed.name}`);
      console.log(`   - Preferences theme: ${transformed.parsedPreferences?.theme || 'undefined'}`);
      console.log(`   - Preferences language: ${transformed.parsedPreferences?.language || 'undefined'}`);
      console.log('');

      // Mostrar parsedPreferences completo
      console.log('📊 parsedPreferences completo:');
      console.log(JSON.stringify(transformed.parsedPreferences, null, 2));
      console.log('');

    } catch (error) {
      console.log('❌ Error en transformador:');
      console.log(error);
    }

    // 4. Intentar estructura alternativa (theme/language directos)
    console.log('4️⃣ Probando estructura alternativa (theme/language directos)...');
    const alternativeStructure = {
      ...currentStructure,
      theme: raw.settingsTheme,
      language: raw.settingsLanguage,
    };

    try {
      const transformed2 = transformProfile(alternativeStructure as any);
      console.log('✅ Transformación alternativa exitosa:');
      console.log(`   - Preferences theme: ${transformed2.parsedPreferences?.theme || 'undefined'}`);
      console.log(`   - Preferences language: ${transformed2.parsedPreferences?.language || 'undefined'}`);
      console.log('');
    } catch (error) {
      console.log('❌ Error en transformador alternativo:');
      console.log(error);
    }

    // 5. Verificar qué busca exactamente el transformador
    console.log('5️⃣ Analizando qué busca el transformador...');
    console.log('🔍 El transformador busca campos en profile.settings (string JSON)');
    console.log('🔍 O en profile.settings (object) para theme/language');
    console.log('');

    // 6. Estructura correcta basada en análisis del transformador
    console.log('6️⃣ Estructura correcta (basada en análisis del transformador)...');
    const correctStructure = {
      ...currentStructure,
      settings: raw.settingsData, // El transformador espera esto como string JSON
    };

    try {
      const transformed3 = transformProfile(correctStructure as any);
      console.log('✅ Transformación correcta:');
      console.log(`   - Preferences theme: ${transformed3.parsedPreferences?.theme || 'undefined'}`);
      console.log(`   - Preferences language: ${transformed3.parsedPreferences?.language || 'undefined'}`);
      console.log('');
    } catch (error) {
      console.log('❌ Error en transformador correcto:');
      console.log(error);
    }

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  }
}

// Ejecutar análisis
debugTransformerStructure();