import Database from 'bun:sqlite';

const db = new Database('db.sqlite');

try {
	console.log('📊 Tablas disponibles:');
	const tables = db.query(`SELECT name FROM sqlite_master WHERE type='table'`).all();
	for (const table of tables) {
		console.log(`  - ${table.name}`);
	}

	// Si hay tabla video, mostrar algunos records
	const videoTables = tables.filter((t) => t.name.toLowerCase().includes('video'));
	if (videoTables.length > 0) {
		console.log('\n🎬 Videos:');
		const videoTable = videoTables[0].name;
		const videos = db.query(`SELECT * FROM ${videoTable} LIMIT 3`).all();
		console.log(videos);
	}
} catch (error) {
	console.error('❌ Error:', error.message);
} finally {
	db.close();
}
