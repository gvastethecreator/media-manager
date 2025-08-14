import { Database } from 'bun:sqlite';

const db = new Database('db.sqlite');
const row = db.query("SELECT path FROM Image WHERE lower(path) LIKE '%.png' LIMIT 1").get();
console.log('PNG row:', row);
