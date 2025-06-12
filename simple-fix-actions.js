/**
 * 🔧 Script mejorado para corregir errores en Server Actions
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 📁 Configuración
const ACTIONS_DIR = 'd:\\DEV\\image-manager\\src\\app\\actions';
const RESULTS_FILE = path.join(__dirname, 'server-actions-fixes.log');

// 📊 Estadísticas
let filesScanned = 0;
let filesModified = 0;
let errors = 0;

// 🔍 Patrones de reemplazo
const REPLACEMENTS = [
	// 1. Eliminar Promise<unknown> de parámetros de entrada
	{
		pattern: /(\w+):\s*Promise<unknown>(\w+)/g,
		replacement: '$1: $2',
	},

	// 2. Corregir funciones sin tipo de retorno
	{
		pattern: /export\s+async\s+function\s+(\w+)\([^)]*\)(?!\s*:)/g,
		replacement: (match, fnName) => {
			return `${match}: Promise<unknown>`;
		},
	},

	// 3. Corregir importaciones de tipos desde módulos incorrectos
	{
		pattern: /import\s+type\s*{[^}]*}\s*from\s*['"]@prisma\/client['"]/g,
		replacement: (match, filePath) => {
			const entity = inferEntityFromFilePath(filePath);
			if (entity) {
				return `// Importar desde tipos canónicos
import type { ${entity}Base } from '@/types/entities/${entity.toLowerCase()}'`;
			}
			return match;
		},
	},

	// 4. Corregir función de transformador
	{
		pattern: /const\s+(\w+)\s*=\s*(\w+)Transformer\.fromDB\(([^)]*)\);/g,
		replacement: (match, varName, transformerName, args) => {
			// No modificar si ya parece estar bien
			if (args.includes('as any')) return match;
			return `const ${varName} = ${transformerName}Transformer.fromDB(${args} as any);`;
		},
	},

	// 5. Corregir uso directo de Prisma Model en lugar de tipo canónico
	{
		pattern: /(\w+)Model(?!\s*=|\s*:)/g,
		replacement: '$1Base',
	},

	// 6. Añadir tipos de retorno a las funciones
	{
		pattern: /export\s+async\s+function\s+(\w+)\s*\([^)]*\)\s*:\s*Promise<unknown>\s*{/g,
		replacement: (match, fnName, filePath) => {
			const entity = inferEntityFromFilePath(filePath);
			if (entity && fnName.startsWith('get')) {
				return match.replace('Promise<unknown>', `Promise<${entity}Base | null>`);
			}
			return match;
		},
	},
];

/**
 * 🧩 Infiere la entidad basado en la ruta del archivo
 */
function inferEntityFromFilePath(filePath) {
	// Extraer nombre del directorio de acciones
	const matches = filePath.match(/actions\/([^/\\]+)/);
	if (matches?.[1]) {
		const entityDir = matches[1];

		// Mapear directorios a entidades
		const entityMap = {
			activity: 'Activity',
			albums: 'Album',
			characters: 'Character',
			collections: 'Collection',
			concepts: 'Concept',
			favorites: 'Favorite',
			files: 'File',
			folders: 'Folder',
			groups: 'Group',
			images: 'Image',
			metadata: 'Metadata',
			notes: 'Note',
			places: 'Place',
			profiles: 'Profile',
			prompts: 'Prompt',
			properties: 'Property',
			queue: 'QueueJob',
			search: 'Search',
			stats: 'Stats',
			system: 'System',
			tags: 'Tag',
			tasks: 'Task',
			thumbnails: 'Thumbnail',
			'uploaded-images': 'UploadedImage',
			videos: 'Video',
			wildcards: 'Wildcard',
			'world-items': 'WorldItem',
		};

		return entityMap[entityDir] || entityDir.charAt(0).toUpperCase() + entityDir.slice(1);
	}

	return null;
}

/**
 * 🔍 Procesa un archivo
 */
async function processFile(filePath) {
	console.log(`Procesando: ${filePath}`);
	filesScanned++;

	try {
		// Leer contenido
		const content = fs.readFileSync(filePath, 'utf8');
		let newContent = content;
		let modified = false;

		// Aplicar reemplazos
		for (const { pattern, replacement } of REPLACEMENTS) {
			newContent = newContent.replace(pattern, (...args) => {
				// Añadir la ruta del archivo como último argumento
				args.push(filePath);
				const result = typeof replacement === 'function' ? replacement(...args) : replacement;

				if (args[0] !== result) {
					modified = true;
				}

				return result;
			});
		}

		// Guardar si hay cambios
		if (modified) {
			fs.writeFileSync(filePath, newContent, 'utf8');
			filesModified++;
			fs.appendFileSync(RESULTS_FILE, `Modificado: ${filePath}\n`, 'utf8');
			console.log(`✅ Archivo modificado: ${filePath}`);
		}
	} catch (err) {
		console.error(`Error procesando ${filePath}:`, err);
		errors++;
	}
}

/**
 * 🚀 Función principal
 */
async function main() {
	console.log('🚀 Iniciando corrección de Server Actions...');

	// Inicializar log
	fs.writeFileSync(RESULTS_FILE, `Inicio: ${new Date().toLocaleString()}\n`, 'utf8');

	try {
		// Buscar archivos
		const files = await glob(`${ACTIONS_DIR}/**/*.{ts,tsx}`);
		console.log(`Encontrados ${files.length} archivos`);

		// Procesar cada archivo
		for (const file of files) {
			await processFile(file);
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

		return {
			filesScanned,
			filesModified,
			errors,
		};
	} catch (err) {
		console.error('Error general:', err);
		return {
			error: err.message,
			filesScanned,
			filesModified,
			errors: errors + 1,
		};
	}
}

main();
