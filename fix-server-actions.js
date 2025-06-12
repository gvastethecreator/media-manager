/**
 * 🔧 Analizador y corrector de tipos para Server Actions
 *
 * Este script se enfoca en resolver problemas relacionados con los tipos
 * en las acciones de servidor (Server Actions).
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const glob = util.promisify(require('glob'));

// 📁 Configuración de rutas
const ROOT_DIR = path.resolve(__dirname);
const ACTIONS_DIR = path.join(ROOT_DIR, 'src/app/actions');
const RESULTS_FILE = 'server-actions-fixes-log.md';

// 📊 Estadísticas
const stats = {
	scanned: 0,
	modified: 0,
	errors: 0,
	skipped: 0,
};

// 🔍 Reglas para server actions
const ACTION_RULES = [
	// 1. Permitir importaciones de Prisma en server actions (son server-only)
	// pero asegurar que se utilicen los tipos correctos
	{
		pattern: /import\s+{\s*([^}]+)\s*}\s+from\s+['"]@prisma\/client['"]/g,
		replacement: (match, imports) => {
			// Asegurarse de que se importa PrismaClient
			if (!imports.includes('PrismaClient') && !imports.includes('Prisma')) {
				return `import { Prisma, PrismaClient, ${imports} } from '@prisma/client'`;
			}
			return match;
		},
	},

	// 2. Corregir errores comunes de tipado con TypeScript
	{
		pattern: /(\w+):\s*any(?!\s*\|)/g,
		replacement: (match, varName) => {
			// Intentar inferir el tipo basado en el nombre de la variable
			const inferredType = inferTypeFromName(varName);
			return `${varName}: ${inferredType}`;
		},
	},

	// 3. Corregir uso incorrecto de Record<string, unknown>
	{
		pattern: /Record<string,\s*unknown>/g,
		replacement: 'Record<string, unknown>',
	},
];

/**
 * 🧠 Intenta inferir un tipo basado en el nombre de la variable
 * @param {string} varName - Nombre de la variable
 * @return {string} Tipo inferido
 */
function inferTypeFromName(varName) {
	// Reglas para inferencia de tipos
	if (varName.endsWith('Id') || varName === 'id') {
		return 'string';
	}
	if (varName.includes('count') || varName.includes('total')) {
		return 'number';
	}
	if (varName.startsWith('is') || varName.startsWith('has')) {
		return 'boolean';
	}
	if (varName.endsWith('At') || varName.includes('date')) {
		return 'Date';
	}
	if (varName.endsWith('s') || varName.includes('list')) {
		return 'unknown[]';
	}

	// Intentar inferir el tipo basado en el contexto del archivo
	return 'unknown';
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

		// Aplicar cada regla
		for (const rule of ACTION_RULES) {
			newContent = newContent.replace(rule.pattern, (match, ...args) => {
				const replacement =
					typeof rule.replacement === 'function' ? rule.replacement(match, ...args, filePath) : rule.replacement;

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
	let i = 0;
	let j = 0;
	while (i < oldLines.length || j < newLines.length) {
		if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
			// Línea sin cambios
			diff += ` ${oldLines[i]}\n`;
			i++;
			j++;
		} else {
			// Revisar algunas líneas adelante para ver si hay coincidencia
			let found = false;
			for (let k = 1; k < 3 && i + k < oldLines.length; k++) {
				if (j < newLines.length && oldLines[i + k] === newLines[j]) {
					// Encontramos coincidencia, las líneas anteriores fueron eliminadas
					for (let l = 0; l < k; l++) {
						diff += `-${oldLines[i + l]}\n`;
					}
					i += k;
					found = true;
					break;
				}
			}

			if (!found && j < newLines.length) {
				// Línea añadida
				diff += `+${newLines[j]}\n`;
				j++;
			} else if (!found) {
				// Línea eliminada
				diff += `-${oldLines[i]}\n`;
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
	console.log('🔧 Iniciando corrección de Server Actions...');

	// Inicializar archivo de resultados
	const header = `# 🔄 Correcciones en Server Actions
  
Fecha: ${new Date().toLocaleString('es-ES')}

`;
	fs.writeFileSync(RESULTS_FILE, header, 'utf8');

	try {
		// Buscar todos los archivos de acciones
		const files = await glob(`${ACTIONS_DIR}/**/*.ts`);
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
