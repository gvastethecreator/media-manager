import { sql } from 'drizzle-orm';
import { db } from '../src/lib/database/db';

async function applyMigration() {
	console.log('🔧 Aplicando migración 0001...\n');

	try {
		// Create dev_features table
		await db.run(sql`
      CREATE TABLE IF NOT EXISTS dev_features (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        progress INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
		console.log('✅ Tabla dev_features creada');

		// Create index on dev_features
		await db.run(sql`
      CREATE INDEX IF NOT EXISTS feature_status_idx ON dev_features (status)
    `);
		console.log('✅ Índice feature_status_idx creado');

		// Create server_alerts table
		await db.run(sql`
      CREATE TABLE IF NOT EXISTS server_alerts (
        id TEXT PRIMARY KEY NOT NULL,
        level TEXT DEFAULT 'info' NOT NULL,
        service TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        details TEXT,
        resolved INTEGER DEFAULT 0 NOT NULL,
        resolved_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `);
		console.log('✅ Tabla server_alerts creada');

		// Create indexes on server_alerts
		await db.run(sql`
      CREATE INDEX IF NOT EXISTS alert_level_idx ON server_alerts (level)
    `);
		await db.run(sql`
      CREATE INDEX IF NOT EXISTS alert_service_idx ON server_alerts (service)
    `);
		await db.run(sql`
      CREATE INDEX IF NOT EXISTS alert_resolved_idx ON server_alerts (resolved)
    `);
		console.log('✅ Índices de server_alerts creados');

		// Insert migration record
		await db.run(sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL UNIQUE,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

		await db.run(sql`
      INSERT OR IGNORE INTO __drizzle_migrations (hash, created_at)
      VALUES ('0001_common_thunderbolt_ross', ${Date.now()})
    `);
		console.log('✅ Registro de migración actualizado');

		console.log('\n🎉 Migración 0001 aplicada exitosamente');
	} catch (error) {
		console.error('❌ Error aplicando migración:', error);
		process.exit(1);
	}
}

applyMigration();
