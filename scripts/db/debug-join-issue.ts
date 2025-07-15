import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../../src/lib/drizzle';
import { profiles, settings } from '../../src/lib/drizzle/schema';

/**
 * Script específico para debuggear el problema del JOIN entre Profile y Settings
 *
 * Ejecución: tsx scripts/db/debug-join-issue.ts
 */

async function debugJoinIssue() {
	console.log('🔍 Debuggeando problema de JOIN Profile-Settings...\n');

	try {
		// 1. Obtener perfil activo sin JOIN
		console.log('1️⃣ Obteniendo perfil activo (sin JOIN)...');
		const activeProfileRaw = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);

		if (activeProfileRaw.length === 0) {
			console.log('❌ No se encontró perfil activo');
			return;
		}

		const activeProfile = activeProfileRaw[0];
		console.log('✅ Perfil activo encontrado:');
		console.log(`   - ID: ${activeProfile.id}`);
		console.log(`   - Nombre: ${activeProfile.name}`);
		console.log(`   - SettingsId: ${activeProfile.settingsId}`);
		console.log('');

		// 2. Buscar settings por ID específico
		if (activeProfile.settingsId) {
			console.log('2️⃣ Buscando settings por ID específico...');
			const settingsById = await db.select().from(settings).where(eq(settings.id, activeProfile.settingsId));

			if (settingsById.length > 0) {
				const setting = settingsById[0];
				console.log('✅ Settings encontrado:');
				console.log(`   - ID: ${setting.id}`);
				console.log(`   - Theme: ${setting.theme}`);
				console.log(`   - Language: ${setting.language}`);
				console.log(`   - ProfileId: ${setting.profileId}`);
				console.log('');
			} else {
				console.log('❌ No se encontraron settings con ese ID');
				console.log('');
			}
		}

		// 3. Intentar JOIN manual
		console.log('3️⃣ Probando JOIN manual...');
		const joinResult = await db
			.select({
				// Profile fields
				profileId: profiles.id,
				profileName: profiles.name,
				profileSettingsId: profiles.settingsId,
				// Settings fields
				settingsId: settings.id,
				settingsTheme: settings.theme,
				settingsLanguage: settings.language,
				settingsProfileId: settings.profileId,
			})
			.from(profiles)
			.leftJoin(settings, eq(profiles.settingsId, settings.id))
			.where(eq(profiles.isActive, true))
			.limit(1);

		if (joinResult.length > 0) {
			const result = joinResult[0];
			console.log('✅ JOIN resultado:');
			console.log(`   - Profile ID: ${result.profileId}`);
			console.log(`   - Profile Name: ${result.profileName}`);
			console.log(`   - Profile SettingsId: ${result.profileSettingsId}`);
			console.log(`   - Settings ID: ${result.settingsId}`);
			console.log(`   - Settings Theme: ${result.settingsTheme}`);
			console.log(`   - Settings Language: ${result.settingsLanguage}`);
			console.log(`   - Settings ProfileId: ${result.settingsProfileId}`);
			console.log('');

			if (!result.settingsId) {
				console.log('⚠️ El JOIN no devolvió datos de settings');
				console.log('   Esto indica que profiles.settingsId no coincide con settings.id');
			}
		} else {
			console.log('❌ El JOIN no devolvió resultados');
		}

		// 4. Verificar relación inversa
		console.log('4️⃣ Probando relación inversa (settings.profileId = profiles.id)...');
		const inverseJoin = await db
			.select({
				// Profile fields
				profileId: profiles.id,
				profileName: profiles.name,
				profileSettingsId: profiles.settingsId,
				// Settings fields
				settingsId: settings.id,
				settingsTheme: settings.theme,
				settingsLanguage: settings.language,
				settingsProfileId: settings.profileId,
			})
			.from(profiles)
			.leftJoin(settings, eq(settings.profileId, profiles.id))
			.where(eq(profiles.isActive, true))
			.limit(1);

		if (inverseJoin.length > 0) {
			const result = inverseJoin[0];
			console.log('✅ JOIN inverso resultado:');
			console.log(`   - Profile ID: ${result.profileId}`);
			console.log(`   - Profile Name: ${result.profileName}`);
			console.log(`   - Profile SettingsId: ${result.profileSettingsId}`);
			console.log(`   - Settings ID: ${result.settingsId}`);
			console.log(`   - Settings Theme: ${result.settingsTheme}`);
			console.log(`   - Settings Language: ${result.settingsLanguage}`);
			console.log(`   - Settings ProfileId: ${result.settingsProfileId}`);
			console.log('');

			if (result.settingsTheme && result.settingsLanguage) {
				console.log('🎯 ¡La relación inversa funciona!');
				console.log('   Usar: settings.profileId = profiles.id');
			}
		}

		// 5. Listar todos los settings para verificar
		console.log('5️⃣ Listando todos los settings...');
		const allSettings = await db.select().from(settings);
		console.log(`📊 Total de settings: ${allSettings.length}`);
		allSettings.forEach((setting, i) => {
			console.log(`   ${i + 1}. ID: ${setting.id}`);
			console.log(`      ProfileId: ${setting.profileId}`);
			console.log(`      Theme: ${setting.theme}`);
			console.log(`      Language: ${setting.language}`);
		});
	} catch (error) {
		console.error('❌ Error durante el debug:', error);
	}
}

// Ejecutar debug
debugJoinIssue();
