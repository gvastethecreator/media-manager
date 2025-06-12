/**
 * 🔧 Script para corregir errores en transformadores
 * Este script se enfoca en resolver problemas comunes relacionados con los transformadores
 * y sus dependencias con tipos de Prisma.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { execSync } = require('child_process');
const glob = util.promisify(require('glob'));

// 📁 Configuración de rutas
const ROOT_DIR = path.resolve(__dirname);
const TRANSFORMERS_DIR = path.join(ROOT_DIR, 'src/transformers');
const TYPES_DIR = path.join(ROOT_DIR, 'src/types/entities');
const RESULTS_FILE = 'transformer-fixes-log.md';

// 📊 Estadísticas
const stats = {
	scanned: 0,
	modified: 0,
	errors: 0,
	skipped: 0,
};

// 🔍 Reglas de reemplazo específicas para transformadores
const TRANSFORMER_RULES = [
	// 1. Reemplazar importaciones de Prisma
	{
		pattern: /import\s+(?:{[^}]*}\s*from\s+)?['"]@prisma\/client['"]/g,
		replacement: (match, file) => {
			// Determinar qué entidad basado en la ruta
			const entityMatch = file.match(/transformers\/([^/]+)/);
			if (!entityMatch) return match;

			const entity = entityMatch[1];
			return `// Usar tipos canónicos en lugar de Prisma
import { ${capitalizeFirst(entity)} } from '@/types/entities/${entity}/types'`;
		},
	},

	// 2. Reemplazar tipos específicos de Prisma
	{
		pattern: /Prisma\.(\w+)(?:Model|)/g,
		replacement: (match, type) => type,
	},

	// 3. Reemplazar imports específicos de enums
	{
		pattern: /import\s+{\s*([^}]+)\s*}\s+from\s+['"]@prisma\/client['"]/g,
		replacement: (match, imports) => {
			// Si contiene `Prisma`, mantenerlo para server actions
			if (imports.includes('Prisma')) {
				return match;
			}

			// Extraer los tipos importados
			const types = imports.split(',').map((t) => t.trim());

			// Crear nuevos imports basados en tipos canónicos
			return `// Usar tipos y enums canónicos
import { ${types.join(', ')} } from '@/types/entities'`;
		},
	},
];

/**
 * 🔤 Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @return {string} String capitalizado
 */
function capitalizeFirst(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 🧹 Procesa un archivo aplicando reglas de corrección
 * @param {string} filePath - Ruta al archivo a procesar
 */
async function processFile(filePath) {
	try {
		stats.scanned++;
		console.log(`📄 Procesando: ${filePath}`);

		// Leer contenido del archivo
		const content = fs.readFileSync(filePath, 'utf8');
		let newContent = content;
		let modified = false;

		// Aplicar cada regla de reemplazo
		for (const rule of TRANSFORMER_RULES) {
			newContent = newContent.replace(rule.pattern, (match) => {
				const replacement =
					typeof rule.replacement === 'function' ? rule.replacement(match, filePath) : rule.replacement;

				if (match !== replacement) {
					modified = true;
					return replacement;
				}
				return match;
			});
		}

		// Si se modificó el archivo, guardarlo
		if (modified) {
			fs.writeFileSync(filePath, newContent, 'utf8');
			stats.modified++;
			console.log(`✅ Modificado: ${filePath}`);

			// Escribir en el log
			logChange(filePath, content, newContent);
		} else {
			stats.skipped++;
			console.log(`⏭️ Sin cambios: ${filePath}`);
		}
	} catch (err) {
		stats.errors++;
		console.error(`❌ Error procesando ${filePath}:`, err);
	}
}

/**
 * 📝 Registra los cambios realizados en un archivo
 * @param {string} filePath - Ruta del archivo
 * @param {string} oldContent - Contenido original
 * @param {string} newContent - Nuevo contenido
 */
function logChange(filePath, oldContent, newContent) {
	const relativePath = path.relative(ROOT_DIR, filePath);
	const log = `
## 📄 ${relativePath}

\`\`\`diff
${generateDiff(oldContent, newContent)}
\`\`\`
`;

	fs.appendFileSync(RESULTS_FILE, log, 'utf8');
}

/**
 * 🔄 Genera un diff simple entre dos contenidos
 * @param {string} oldContent - Contenido original
 * @param {string} newContent - Nuevo contenido
 * @return {string} Diff en formato string
 */
function generateDiff(oldContent, newContent) {
	const oldLines = oldContent.split('\n');
	const newLines = newContent.split('\n');
	let diff = '';

	// Algoritmo simple de diff línea por línea
	let i = 0,
		j = 0;
	while (i < oldLines.length || j < newLines.length) {
		if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
			// Línea sin cambios
			diff += ' ' + oldLines[i] + '\n';
			i++;
			j++;
		} else {
			// Revisar algunas líneas adelante para ver si hay coincidencia
			let found = false;
			for (let k = 1; k < 3 && i + k < oldLines.length; k++) {
				if (j < newLines.length && oldLines[i + k] === newLines[j]) {
					// Encontramos coincidencia, las líneas anteriores fueron eliminadas
					for (let l = 0; l < k; l++) {
						diff += '-' + oldLines[i + l] + '\n';
					}
					i += k;
					found = true;
					break;
				}
			}

			if (!found && j < newLines.length) {
				// Línea añadida
				diff += '+' + newLines[j] + '\n';
				j++;
			} else if (!found) {
				// Línea eliminada
				diff += '-' + oldLines[i] + '\n';
				i++;
			}
		}
	}

	return diff;
}

/**
 * 🚀 Función principal
 */
async function main() {
	console.log('🔧 Iniciando corrección de transformadores...');

	// Inicializar archivo de resultados
	const header = `# 🔄 Correcciones en Transformadores
  
Fecha: ${new Date().toLocaleString('es-ES')}

`;
	fs.writeFileSync(RESULTS_FILE, header, 'utf8');

	try {
		// Buscar todos los archivos en transformers
		const files = await glob(`${TRANSFORMERS_DIR}/**/*.{ts,tsx}`);
		console.log(`🔍 Encontrados ${files.length} archivos`);

		// Procesar cada archivo
		for (const file of files) {
			await processFile(file);
		}

		// Escribir resumen
		const summary = `
## 📊 Resumen

- ✅ Archivos modificados: ${stats.modified}
- ⏭️ Archivos sin cambios: ${stats.skipped}
- ❌ Errores: ${stats.errors}
- 🔍 Total escaneados: ${stats.scanned}
`;
		fs.appendFileSync(RESULTS_FILE, summary, 'utf8');

		console.log(summary);
		console.log(`📝 Resultados guardados en ${RESULTS_FILE}`);
	} catch (err) {
		console.error('❌ Error general:', err);
	}
}

// Ejecutar script
main();
