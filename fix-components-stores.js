/**
 * 🔧 Script para corregir errores en componentes y stores
 */

const fs = require('fs');
const path = require('path');

// 📁 Configuración
const COMPONENTS_DIR = 'd:\\DEV\\image-manager\\src\\components';
const STORE_DIR = 'd:\\DEV\\image-manager\\src\\store';
const RESULTS_FILE = 'd:\\DEV\\image-manager\\component-store-fixes.log';

// 📊 Estadísticas
let filesScanned = 0;
let filesModified = 0;
let errors = 0;

// 🔎 Patrones de reemplazo
const REPLACEMENTS = [
	// 1. Reemplazar importaciones de Prisma en componentes y stores
	{
		pattern: /import\s+.*from\s+['"]@prisma\/client['"]/g,
		replacement: (match, filePath) => {
			// Intentar inferir la entidad desde la ruta
			const entity = inferEntityFromPath(filePath);
			if (entity) {
				return `// Usar tipos canónicos en lugar de Prisma
import type { ${entity} } from '@/types/entities/${entity.toLowerCase()}/types'`;
			}
			return `// TODO: Reemplazar con tipos canónicos apropiados
// ${match}`;
		},
	},

	// 2. Reemplazar tipos específicos de Prisma
	{
		pattern: /Prisma\.(\w+)(?:Model|)/g,
		replacement: '$1',
	},

	// 3. Corregir problemas comunes en componentes
	{
		pattern: /(interface|type)\s+(\w+Props)\s+=\s+{[^}]*any[^}]*}/g,
		replacement: (match) => {
			// Reemplazar 'any' con tipos más específicos cuando sea posible
			return match.replace(/: any/g, ': unknown');
		},
	},

	// 4. Corregir problemas en stores
	{
		pattern: /state:\s*{[^}]*}(?=\s*,\s*actions:)/g,
		replacement: (match) => {
			// Añadir tipos explícitos a las propiedades de state en stores Zustand
			return match.replace(/(\w+):\s*(\[\]|{})(?!\s*as\s)/g, '$1: $2 as any');
		},
	},
];

/**
 * 🧩 Infiere la entidad basado en la ruta del archivo
 */
function inferEntityFromPath(filePath) {
	// Patrones de carpetas específicas de entidad
	const patterns = [
		/components\/cards\/(\w+)-card/,
		/components\/entities\/(\w+)/,
		/components\/views\/(\w+)/,
		/store\/entities\/(\w+)/,
	];

	for (const pattern of patterns) {
		const matches = filePath.match(pattern);
		if (matches && matches[1]) {
			const entity = matches[1];
			// Singularizar si termina en s (excepciones: settings, stats)
			if (entity.endsWith('s') && !['settings', 'stats'].includes(entity)) {
				return entity.slice(0, -1).charAt(0).toUpperCase() + entity.slice(1, -1);
			}
			// Capitalizar primera letra
			return entity.charAt(0).toUpperCase() + entity.slice(1);
		}
	}

	return null;
}

/**
 * 🔍 Procesa un archivo
 */
function processFile(filePath) {
	console.log(`Procesando: ${filePath}`);
	filesScanned++;

	try {
		const content = fs.readFileSync(filePath, 'utf8');
		let newContent = content;
		let modified = false;

		// Aplicar reemplazos
		for (const { pattern, replacement } of REPLACEMENTS) {
			newContent = newContent.replace(pattern, (match, ...args) => {
				const result = typeof replacement === 'function' ? replacement(match, filePath, ...args) : replacement;

				if (result !== match) {
					modified = true;
				}

				return result;
			});
		}

		// Guardar cambios si se modificó
		if (modified) {
			fs.writeFileSync(filePath, newContent, 'utf8');
			filesModified++;
			console.log(`✅ Modificado: ${filePath}`);

			// Registrar en log
			fs.appendFileSync(RESULTS_FILE, `Modificado: ${filePath}\n`, 'utf8');
		}
	} catch (err) {
		console.error(`Error en ${filePath}:`, err);
		errors++;
	}
}

/**
 * 📂 Encuentra recursivamente archivos .ts y .tsx
 */
function findTsFiles(dir) {
	let results = [];

	const items = fs.readdirSync(dir);

	for (const item of items) {
		const fullPath = path.join(dir, item);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			// Es un directorio, buscar recursivamente
			results = results.concat(findTsFiles(fullPath));
		} else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
			// Es un archivo TypeScript, añadirlo
			results.push(fullPath);
		}
	}

	return results;
}

/**
 * 🚀 Función principal
 */
function main() {
	console.log('🚀 Iniciando corrección de componentes y stores...');

	// Inicializar log
	fs.writeFileSync(RESULTS_FILE, `Inicio: ${new Date().toLocaleString()}\n`, 'utf8');

	try {
		// Buscar archivos en componentes
		const componentFiles = findTsFiles(COMPONENTS_DIR);
		console.log(`Encontrados ${componentFiles.length} archivos en components`);

		// Buscar archivos en stores
		const storeFiles = findTsFiles(STORE_DIR);
		console.log(`Encontrados ${storeFiles.length} archivos en store`);

		// Combinar archivos
		const allFiles = [...componentFiles, ...storeFiles];
		console.log(`Total: ${allFiles.length} archivos`);

		// Procesar cada archivo
		for (const file of allFiles) {
			processFile(file);
		}

		// Resumen
		const summary = `
Resumen:
- Archivos escaneados: ${filesScanned}
- Archivos modificados: ${filesModified}
- Errores: ${errors}
`;
		console.log(summary);
		fs.appendFileSync(RESULTS_FILE, summary, 'utf8');
	} catch (err) {
		console.error('Error general:', err);
	}
}

main();
