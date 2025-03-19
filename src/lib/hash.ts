import { createHash } from 'crypto';
import { createReadStream } from 'fs';

/**
 * Calcula el hash SHA-256 de un archivo
 * @param filePath Ruta del archivo
 * @returns Promise con el hash en formato hexadecimal
 */
export async function computeHash(filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const hash = createHash('sha256');
		const stream = createReadStream(filePath);

		stream.on('error', (error) => {
			reject(error instanceof Error ? error : new Error('Error al leer el archivo'));
		});

		stream.on('data', (chunk) => {
			hash.update(chunk);
		});

		stream.on('end', () => {
			resolve(hash.digest('hex'));
		});
	});
}

/**
 * Calcula el hash SHA-256 de una cadena de texto
 * @param text Texto a hashear
 * @returns Hash en formato hexadecimal
 */
export function computeTextHash(text: string): string {
	return createHash('sha256').update(text).digest('hex');
}

/**
 * Calcula el hash SHA-256 de un objeto
 * @param obj Objeto a hashear
 * @returns Hash en formato hexadecimal
 */
export function computeObjectHash(obj: unknown): string {
	return computeTextHash(JSON.stringify(obj));
}
