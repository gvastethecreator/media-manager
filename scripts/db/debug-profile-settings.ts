import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../../src/lib/drizzle';
import { profiles, settings } from '../../src/lib/drizzle/schema';

/**
 * Script de debug para investigar la relación Profile-Settings
 */

async function debugProfileSettings() {
  console.log('🔍 Investigando relación Profile-Settings...\n');

  try {
    // 1. Obtener todos los perfiles
    console.log('1️⃣ Obteniendo todos los perfiles...');
    const allProfiles = await db.select().from(profiles);

    console.log(`📊 Total de perfiles: ${allProfiles.length}`);
    allProfiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.name} (ID: ${profile.id})`);
      console.log(`      - Activo: ${profile.isActive}`);
      console.log(`      - SettingsId: ${profile.settingsId || 'NULL'}`);
    });
    console.log('');

    // 2. Obtener todos los settings
    console.log('2️⃣ Obteniendo todos los settings...');
    const allSettings = await db.select().from(settings);

    console.log(`📊 Total de settings: ${allSettings.length}`);
    allSettings.forEach((setting, index) => {
      console.log(`   ${index + 1}. Settings ID: ${setting.id}`);
      console.log(`      - Theme: ${setting.theme}`);
      console.log(`      - Language: ${setting.language}`);
      console.log(`      - ProfileId: ${setting.profileId}`);
    });
    console.log('');

    // 3. Probar JOIN específico para perfil activo
    console.log('3️⃣ Probando JOIN para perfil activo...');
    const activeProfileWithSettings = await db.select({
      // Profile fields
      profileId: profiles.id,
      profileName: profiles.name,
      profileIsActive: profiles.isActive,
      profileSettingsId: profiles.settingsId,
      // Settings fields
      settingsId: settings.id,
      settingsTheme: settings.theme,
      settingsLanguage: settings.language,
      settingsProfileId: settings.profileId,
    })
      .from(profiles)
      .leftJoin(settings, eq(profiles.settingsId, settings.id))
      .where(eq(profiles.isActive, true));

    console.log('📊 Resultado del JOIN:');
    if (activeProfileWithSettings.length > 0) {
      const result = activeProfileWithSettings[0];
      console.log(`   - Profile ID: ${result.profileId}`);
      console.log(`   - Profile Name: ${result.profileName}`);
      console.log(`   - Profile SettingsId: ${result.profileSettingsId}`);
      console.log(`   - Settings ID: ${result.settingsId || 'NULL'}`);
      console.log(`   - Settings Theme: ${result.settingsTheme || 'NULL'}`);
      console.log(`   - Settings Language: ${result.settingsLanguage || 'NULL'}`);
      console.log(`   - Settings ProfileId: ${result.settingsProfileId || 'NULL'}`);
    } else {
      console.log('   ❌ No se encontró perfil activo');
    }
    console.log('');

    // 4. Probar JOIN alternativo usando profileId en settings
    console.log('4️⃣ Probando JOIN alternativo usando settings.profileId...');
    const alternativeJoin = await db.select({
      // Profile fields
      profileId: profiles.id,
      profileName: profiles.name,
      profileIsActive: profiles.isActive,
      profileSettingsId: profiles.settingsId,
      // Settings fields
      settingsId: settings.id,
      settingsTheme: settings.theme,
      settingsLanguage: settings.language,
      settingsProfileId: settings.profileId,
    })
      .from(profiles)
      .leftJoin(settings, eq(profiles.id, settings.profileId))
      .where(eq(profiles.isActive, true));

    console.log('📊 Resultado del JOIN alternativo:');
    if (alternativeJoin.length > 0) {
      const result = alternativeJoin[0];
      console.log(`   - Profile ID: ${result.profileId}`);
      console.log(`   - Profile Name: ${result.profileName}`);
      console.log(`   - Profile SettingsId: ${result.profileSettingsId}`);
      console.log(`   - Settings ID: ${result.settingsId || 'NULL'}`);
      console.log(`   - Settings Theme: ${result.settingsTheme || 'NULL'}`);
      console.log(`   - Settings Language: ${result.settingsLanguage || 'NULL'}`);
      console.log(`   - Settings ProfileId: ${result.settingsProfileId || 'NULL'}`);
    } else {
      console.log('   ❌ No se encontró perfil activo con JOIN alternativo');
    }
    console.log('');

    // 5. Verificar relación en Prisma schema
    console.log('5️⃣ Análisis de la relación...');

    if (allProfiles.length > 0 && allSettings.length > 0) {
      const activeProfile = allProfiles.find(p => p.isActive);
      if (activeProfile) {
        console.log(`📋 Perfil activo: ${activeProfile.name}`);
        console.log(`   - Profile.settingsId: ${activeProfile.settingsId || 'NULL'}`);

        const matchingSettings = allSettings.find(s => s.id === activeProfile.settingsId);
        const alternativeSettings = allSettings.find(s => s.profileId === activeProfile.id);

        if (matchingSettings) {
          console.log(`   ✅ Settings encontrado por settingsId: ${matchingSettings.id}`);
        } else {
          console.log(`   ❌ No se encontró settings con ID: ${activeProfile.settingsId}`);
        }

        if (alternativeSettings) {
          console.log(`   ✅ Settings encontrado por profileId: ${alternativeSettings.id}`);
        } else {
          console.log(`   ❌ No se encontró settings con profileId: ${activeProfile.id}`);
        }
      }
    }

    console.log('\n🎯 Conclusiones:');
    console.log('   - Si el JOIN original falla, usar JOIN por profileId');
    console.log('   - Verificar la estructura de relaciones en Prisma vs Drizzle');

  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  }
}

// Ejecutar debug
debugProfileSettings();