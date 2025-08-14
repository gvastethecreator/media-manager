import { Database } from 'bun:sqlite';

const db = new Database('db.sqlite');
const row = db
	.query("SELECT id, path, substr(metadata,1,160) snippet FROM Image WHERE path LIKE '%Comfy%output%' LIMIT 1")
	.get();
console.log('PNG candidate:', row);
