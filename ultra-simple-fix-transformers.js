/**
 * 🔧 Script ultra simplificado para corregir errores en transformadores
 */

const fs = require('fs');
const path = require('path');

// 📁 Configuración
const TRANSFORMERS_DIR = 'd:\\DEV\\image-manager\\src\\transformers';
const RESULTS_FILE = 'd:\\DEV\\image-manager\\transformer-fixes.log';

// 📊 Estadísticas
let filesScanned = 0;
let filesModified = 0;
let errors = 0;

// 🔎 Patrones de reemplazo
const REPLACEMENTS = [
	// 1. Reemplazar importaciones de Prisma
	{
		pattern: /import\s+.*from\s+['"]@prisma\/client['"]/g,
		replacement: (match, filePath) => {
			const entity = inferEntityFromPath(filePath);
			if (entity) {
				return `// Usar tipos canónicos en lugar de Prisma
import { ${entity} } from '@/types/entities/${entity.toLowerCase()}/types'`;
			}
			return `// TODO: Reemplazar con tipos canónicos
${match}`;
		},
	},

	// 2. Reemplazar tipos específicos de Prisma
	{
		pattern: /Prisma\.(\w+)(?:Model|)/g,
		replacement: '$1',
	},
];

/**
 * 🧩 Infiere la entidad basado en la ruta del archivo
 */
function inferEntityFromPath(filePath) {
	const matches = filePath.match(/transformers[\\/]([^\\\/]+)/);
	if (matches && matches[1]) {
		const entity = matches[1];
		// Capitalizar primera letra
		return entity.charAt(0).toUpperCase() + entity.slice(1);
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
			newContent = newContent.replace(pattern, (match) => {
				const result = typeof replacement === 'function' ? replacement(match, filePath) : replacement;

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
	console.log('🚀 Iniciando corrección de transformadores...');

	// Inicializar log
	fs.writeFileSync(RESULTS_FILE, `Inicio: ${new Date().toLocaleString()}\n`, 'utf8');

	try {
		// Buscar archivos
		const files = findTsFiles(TRANSFORMERS_DIR);
		console.log(`Encontrados ${files.length} archivos`);

		// Procesar cada archivo
		for (const file of files) {
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
