import { Database } from 'bun:sqlite';
import { promises as fs } from 'node:fs';
import { basename } from 'node:path';
import { extractAllMetadata } from '../src/server/services/metadata/unified-parser.service';

const db = new Database('db.sqlite');
async function run() {
	const row = db.query("SELECT id, path FROM Image WHERE path LIKE '%Comfy%output%' LIMIT 1").get();
	if (!row) {
		console.log('No row');
		return;
	}
	const filePath = row.path;
	const id = row.id;
	const buf = await fs.readFile(filePath);
	const result = await extractAllMetadata(buf, basename(filePath));
	console.log('Unified extraction result summary:', {
		success: result.success,
		hasAI: !!result.ai_metadata,
		origin: result.origin,
		aiKeys: result.ai_metadata ? Object.keys(result.ai_metadata) : [],
	});
	if (result.ai_metadata) {
		const metaObj = {
			parser: result.parser_used,
			processingTime: result.processing_time,
			origin: result.origin,
			ai_metadata: result.ai_metadata,
			exif: result.exif,
			iptc: result.iptc,
			xmp: result.xmp,
			base: result.base,
			errors: result.errors,
			warnings: result.warnings,
		};
		db.query("UPDATE Image SET metadata = ? , updatedAt = strftime('%s','now')*1000 WHERE id = ?").run(
			JSON.stringify(metaObj),
			id
		);
		console.log('Persisted ai_metadata for', id);
	}
}
run().catch((e) => console.error(e));
