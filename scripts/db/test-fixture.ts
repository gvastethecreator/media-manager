import { Database } from 'bun:sqlite';

export const TEST_PROFILE_ID = '88888888-8888-4888-a888-888888888881';

export function seedDeterministicTestFixture(databasePath: string): void {
	const database = new Database(databasePath, { strict: true });
	try {
		const seed = database.transaction(() => {
			database
				.query(
					`INSERT OR IGNORE INTO Profile
					 (id, name, emoji, color, description, isActive, createdAt, updatedAt, settingsId, imageId)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
				)
				.run(
					TEST_PROFILE_ID,
					'Fixture principal',
					'P',
					'#3b82f6',
					'Perfil determinista para tests herméticos',
					0,
					1_700_000_000_000,
					1_700_000_000_000
				);
			database
				.query(
					`INSERT OR IGNORE INTO Settings (id, theme, language, data, profileId)
					 VALUES (?, ?, ?, ?, ?)`
				)
				.run('fixture-settings-primary', 'system', 'es', '{}', TEST_PROFILE_ID);
		});
		seed.immediate();
	} finally {
		database.clearQueryCache();
		database.close();
	}
}
