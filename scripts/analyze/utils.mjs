/**
 * Utilidades para el sistema de análisis del proyecto
 * @module utils
 */

import fs from 'fs/promises';
import { existsSync } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simplifica una ruta de archivo para mostrarla de forma más legible
 * @param {string} filePath - Ruta del archivo a simplificar
 * @returns {string} Ruta simplificada
 */
export function simplifyPath(filePath) {
	const projectRoot = path.resolve(__dirname, '../../');
	return filePath.replace(projectRoot, '').replace(/\\/g, '/');
}

/**
 * Formatea un tamaño en bytes a una unidad más legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado con unidad
 */
export function formatBytes(bytes) {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Obtiene todos los archivos de un directorio de forma recursiva
 * @param {string} dir - Directorio a analizar
 * @returns {Promise<string[]>} Lista de rutas de archivos
 */
export async function getAllFiles(dir) {
	const files = [];

	try {
		// Verificar si el directorio existe
		try {
			await fs.access(dir);
		} catch (error) {
			console.error(`❌ El directorio ${dir} no existe.`);
			return files;
		}

		const entries = await fs.readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				if (!CONFIG.excludeDirs.includes(entry.name)) {
					const subFiles = await getAllFiles(fullPath);
					files.push(...subFiles);
				}
			} else {
				// Solo incluir archivos con extensiones permitidas
				if (CONFIG.fileExtensions.some((ext) => fullPath.endsWith(ext))) {
					files.push(fullPath);
				}
			}
		}
	} catch (error) {
		console.error(`❌ Error al leer el directorio ${dir}:`, error);
	}

	return files;
}

/**
 * Calcula el tamaño total de un directorio
 * @param {string} dir - Directorio a analizar
 * @returns {Promise<number>} Tamaño en bytes
 */
export async function calculateDirectorySize(dir) {
	let size = 0;
	const items = await fs.readdir(dir);

	for (const item of items) {
		const itemPath = path.join(dir, item);
		const stats = await fs.stat(itemPath);

		if (stats.isDirectory()) {
			size += await calculateDirectorySize(itemPath);
		} else {
			size += stats.size;
		}
	}

	return size;
}

/**
 * Genera un árbol de directorios para visualización
 * @param {string} dir - Directorio raíz
 * @param {string} prefix - Prefijo para la indentación
 * @param {boolean} includeSize - Si se debe incluir el tamaño
 * @returns {Promise<string>} Representación en texto del árbol
 */
export async function generateDirectoryTree(dir, prefix = '', includeSize = true) {
	let tree = '';
	const items = await fs.readdir(dir);
	const itemsWithStats = await Promise.all(
		items.map(async (item) => {
			const itemPath = path.join(dir, item);
			const stats = await fs.stat(itemPath);
			const size = stats.isDirectory() ? await calculateDirectorySize(itemPath) : stats.size;
			return { item, stats, size };
		})
	);

	// Ordenar directorios primero, luego archivos
	itemsWithStats.sort((a, b) => {
		if (a.stats.isDirectory() && !b.stats.isDirectory()) return -1;
		if (!a.stats.isDirectory() && b.stats.isDirectory()) return 1;
		return a.item.localeCompare(b.item);
	});

	for (let i = 0; i < itemsWithStats.length; i++) {
		const { item, stats, size } = itemsWithStats[i];
		const isLast = i === itemsWithStats.length - 1;
		const itemPath = path.join(dir, item);

		// Ignorar directorios excluidos
		if (CONFIG.excludeDirs.includes(item)) continue;

		// Añadir elemento al árbol con su tamaño
		const sizeStr = includeSize ? ` (${formatBytes(size)})` : '';
		tree += `${prefix}${isLast ? '└── ' : '├── '}${item}${sizeStr}\n`;

		// Si es un directorio, procesar recursivamente
		if (stats.isDirectory()) {
			const newPrefix = prefix + (isLast ? '    ' : '│   ');
			tree += await generateDirectoryTree(itemPath, newPrefix, includeSize);
		}
	}

	return tree;
}

/**
 * Obtiene un emoji de estado según una puntuación
 * @param {number} score - Puntuación (0-100)
 * @returns {string} Emoji representativo
 */
export function getScoreEmoji(score) {
	if (score >= 90) return '🌟';
	if (score >= 80) return '✨';
	if (score >= 70) return '✅';
	if (score >= 60) return '⚠️';
	return '❌';
}

/**
 * Verifica si un archivo existe
 * @param {string} filePath - Ruta del archivo
 * @returns {boolean} True si existe, false en caso contrario
 */
export function fileExists(filePath) {
	return existsSync(filePath);
}

/**
 * Crea un directorio si no existe
 * @param {string} dirPath - Ruta del directorio
 * @returns {Promise<void>}
 */
export async function ensureDirectoryExists(dirPath) {
	try {
		await fs.mkdir(dirPath, { recursive: true });
	} catch (error) {
		console.error(`Error al crear directorio ${dirPath}:`, error);
		throw error;
	}
}

/**
 * Escribe un archivo con contenido
 * @param {string} filePath - Ruta del archivo
 * @param {string} content - Contenido a escribir
 * @returns {Promise<void>}
 */
export async function writeFile(filePath, content) {
	try {
		await fs.writeFile(filePath, content, 'utf-8');
	} catch (error) {
		console.error(`Error al escribir archivo ${filePath}:`, error);
		throw error;
	}
}

/**
 * Lee y parsea un archivo JSON
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<Object>} Contenido del archivo JSON
 */
export async function readJsonFile(filePath) {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		return JSON.parse(content);
	} catch (error) {
		console.error(`Error al leer el archivo JSON ${filePath}:`, error);
		return null;
	}
}

/**
 * Escribe un objeto como archivo JSON
 * @param {string} filePath - Ruta del archivo
 * @param {Object} data - Datos a escribir
 * @returns {Promise<boolean>} True si se escribió correctamente
 */
export async function writeJsonFile(filePath, data) {
	try {
		await fs.writeFile(filePath, JSON.stringify(data, null, 2));
		return true;
	} catch (error) {
		console.error(`Error al escribir el archivo JSON ${filePath}:`, error);
		return false;
	}
}

/**
 * Genera un timestamp formateado
 * @returns {string} Timestamp en formato YYYY-MM-DD_HH-mm-ss
 */
export function getTimestamp() {
	const now = new Date();
	const pad = (n) => n.toString().padStart(2, '0');

	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

/**
 * Crea un directorio si no existe
 * @param {string} dir - Ruta del directorio
 * @returns {Promise<boolean>} True si se creó o ya existía
 */
export async function ensureDir(dir) {
	try {
		await fs.access(dir);
		return true;
	} catch {
		try {
			await fs.mkdir(dir, { recursive: true });
			return true;
		} catch (error) {
			console.error(`Error al crear el directorio ${dir}:`, error);
			return false;
		}
	}
}

export default {
	simplifyPath,
	formatBytes,
	getAllFiles,
	calculateDirectorySize,
	generateDirectoryTree,
	getScoreEmoji,
	fileExists,
	ensureDirectoryExists,
	writeFile,
	readJsonFile,
	writeJsonFile,
	getTimestamp,
	ensureDir,
};
