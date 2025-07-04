import 'dotenv/config';
import { db } from '../../src/lib/drizzle';
import { settings } from '../../src/lib/drizzle/schema';

/**
 * Script para investigar el contenido del campo 'data' en Settings
 */

async function debugSettingsData() {
	console.log('🔍 Investigando contenido de settings.data...\n');

	try {
		// Obtener todos los settings
		const allSettings = await db.select().from(settings);

		console.log(`📊 Total de settings: ${allSettings.length}\n`);

		allSettings.forEach((setting, index) => {
			console.log(`${index + 1}. Settings ID: ${setting.id}`);
			console.log(`   - Theme: ${setting.theme}`);
			console.log(`   - Language: ${setting.language}`);
			console.log(`   - ProfileId: ${setting.profileId}`);
			console.log(`   - Data (raw): ${setting.data}`);
			console.log(`   - Data (type): ${typeof setting.data}`);

			// Intentar parsear el data si es string
			if (typeof setting.data === 'string') {
				try {
					const parsed = JSON.parse(setting.data);
					console.log('   - Data (parsed):', parsed);
				} catch (e) {
					console.log('   - Data (parse error):', e.message);
				}
			} else {
				console.log('   - Data (object):', setting.data);
			}
			console.log('');
		});
	} catch (error) {
		console.error('❌ Error durante el debug:', error);
	}
}

// Ejecutar debug
debugSettingsData();
