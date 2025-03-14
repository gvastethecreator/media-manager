/**
 * Analizador de imports
 * @module imports-analyzer
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config.mjs';
import { getAllFiles, simplifyPath } from '../utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analiza los imports del proyecto
 * @returns {Promise<Object>} Resultados del análisis
 */
export async function analyzeImports() {
	try {
		const projectRoot = path.resolve(__dirname, '../../../');
		const srcDir = CONFIG.srcDir;

		// Obtener todos los archivos
		const allFiles = await getAllFiles(srcDir, CONFIG.excludeDirs);

		// Filtrar por extensiones permitidas
		const files = allFiles.filter((file) => {
			const ext = path.extname(file).toLowerCase();
			return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
		});

		// Estadísticas de imports
		const importStats = {
			totalImports: 0,
			internalImports: 0,
			externalImports: 0,
			relativeImports: 0,
			absoluteImports: 0,
			importsByPackage: {},
			circularDependencies: [],
			unusedImports: [],
		};

		// Mapa de dependencias para detectar circulares
		const dependencyMap = {};

		// Analizar cada archivo
		for (const file of files) {
			const content = await fs.readFile(file, 'utf-8');
			const lines = content.split('\n');

			// Extraer imports
			const imports = [];
			const importRegex =
				/import\s+(?:{[^}]*}|\*\s+as\s+[^,]+|[^,{}\s]+)?\s*(?:,\s*(?:{[^}]*}|[^,{}\s]+))?\s*from\s+['"]([^'"]+)['"]/g;

			let match;
			while ((match = importRegex.exec(content)) !== null) {
				const importPath = match[1];
				imports.push(importPath);

				// Actualizar estadísticas
				importStats.totalImports++;

				// Clasificar el tipo de import
				if (importPath.startsWith('.')) {
					importStats.relativeImports++;
					importStats.internalImports++;
				} else if (importPath.startsWith('@/')) {
					importStats.absoluteImports++;
					importStats.internalImports++;
				} else {
					importStats.externalImports++;

					// Contar imports por paquete
					const packageName = importPath.split('/')[0];
					importStats.importsByPackage[packageName] = (importStats.importsByPackage[packageName] || 0) + 1;
				}
			}

			// Guardar dependencias para análisis de circulares
			dependencyMap[simplifyPath(file)] = imports.filter((imp) => imp.startsWith('.') || imp.startsWith('@/'));

			// Buscar imports no utilizados (análisis simple)
			for (const importPath of imports) {
				if (importPath.startsWith('.') || importPath.startsWith('@/')) {
					const importedName = importPath.split('/').pop();
					const regex = new RegExp(`\\b${importedName}\\b`);

					// Verificar si el import se usa en el archivo
					let isUsed = false;
					for (const line of lines) {
						if (line.includes('import') || line.includes('export')) continue;
						if (regex.test(line)) {
							isUsed = true;
							break;
						}
					}

					if (!isUsed) {
						importStats.unusedImports.push({
							file: simplifyPath(file),
							import: importPath,
						});
					}
				}
			}
		}

		// Detectar dependencias circulares (análisis simple)
		for (const [file, deps] of Object.entries(dependencyMap)) {
			for (const dep of deps) {
				// Convertir import relativo a ruta absoluta
				const fileDir = path.dirname(file);
				let depPath;

				if (dep.startsWith('.')) {
					depPath = path.normalize(path.join(fileDir, dep));

					// Añadir extensión si no tiene
					if (!path.extname(depPath)) {
						for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
							const fullPath = `${depPath}${ext}`;
							if (Object.keys(dependencyMap).includes(fullPath)) {
								depPath = fullPath;
								break;
							}
						}
					}
				} else if (dep.startsWith('@/')) {
					depPath = path.join(srcDir, dep.substring(2));
				} else {
					continue; // Ignorar dependencias externas
				}

				// Verificar si hay dependencia circular
				if (dependencyMap[depPath] && dependencyMap[depPath].includes(file)) {
					importStats.circularDependencies.push({
						file1: file,
						file2: depPath,
					});
				}
			}
		}

		// Ordenar paquetes por número de imports
		const sortedPackages = Object.entries(importStats.importsByPackage)
			.sort((a, b) => b[1] - a[1])
			.reduce((obj, [key, value]) => {
				obj[key] = value;
				return obj;
			}, {});

		importStats.importsByPackage = sortedPackages;

		// Asegurar que el objeto tenga la estructura esperada por el generador de reportes
		return {
			statistics: importStats.importsByPackage || {},
			exportStatistics: {},
			duplicates: importStats.circularDependencies || [],
			unusedImports: importStats.unusedImports || [],
			unusedExports: [],
		};
	} catch (error) {
		console.error('Error al analizar los imports:', error);
		throw error;
	}
}

export default {
	analyzeImports,
};
