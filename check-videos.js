// Script para verificar videos en la base de datos
import Database from 'bun:sqlite';

const db = new Database('db.sqlite');

try {
	const videos = db.query('SELECT id, path FROM videos LIMIT 5').all();
	console.log('Videos encontrados:', videos);
} catch (error) {
	console.error('Error consultando la base de datos:', error);
} finally {
	db.close();
}
