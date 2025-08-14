import { Database } from 'bun:sqlite';

const db = new Database('db.sqlite');
try {
	const rows = db
		.query("SELECT id, substr(metadata,1,400) snippet FROM Image WHERE metadata LIKE '%ai_metadata%' LIMIT 10")
		.all();
	console.log('Rows with ai_metadata key:', rows.length);
	for (const r of rows) {
		console.log(r.id, r.snippet);
	}
	const sample = db.query('SELECT id, metadata FROM Image WHERE metadata IS NOT NULL LIMIT 1').get();
	if (sample) {
		const parsed = JSON.parse(sample.metadata);
		console.log('Sample metadata top-level keys:', Object.keys(parsed));
		console.log('Sample has ai_metadata?', !!parsed.ai_metadata);
		if (parsed.ai_metadata) {
			console.log('ai_metadata keys:', Object.keys(parsed.ai_metadata));
		}
	}
} catch (e) {
	console.error('Error querying Image table', e);
}
