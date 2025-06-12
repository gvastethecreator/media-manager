/**
 * 🔧 Script avanzado para corregir errores en transformadores
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 📁 Configuración
const TRANSFORMERS_DIR = 'd:\\DEV\\image-manager\\src\\transformers';
const RESULTS_FILE = path.join(__dirname, 'transformer-fixes.log');

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
import type { ${entity}Base } from '@/types/entities/${entity.toLowerCase()}'`;
			}
			return `// TODO: Reemplazar con tipos canónicos
${match}`;
		},
	},

	// 2. Reemplazar tipos específicos de Prisma
	{
		pattern: /Prisma\.(\w+)(?:Model|)/g,
		replacement: '$1Base',
	},

	// 3. Reemplazar uso de Record<string, any> para tipar datos
	{
		pattern: /(export\s+const\s+\w+Transformer\s*=\s*{[^}]*fromDB:\s*\(record:\s*)any(\)\s*=>\s*{)/g,
		replacement: (match, prefix, suffix, filePath) => {
			const entity = inferEntityFromPath(filePath);
			if (entity) {
				return `${prefix}any /* ${entity}Base */` + suffix;
			}
			return match;
		},
	},

	// 4. Eliminar Promise<unknown>
	{
		pattern: /Promise<unknown>(\w+)/g,
		replacement: '$1',
	},

	// 5. Corregir funciones con tipado adecuado para transformadores
	{
		pattern: /(toDB:\s*\(\s*\w+\s*:\s*)Partial<\w+>(\)\s*=>\s*{)/g,
		replacement: '$1any$2',
	},

	// 6. Corregir referencia incorrecta a otros modelos
	{
		pattern: /(\w+)Model(?!\s*=|\s*:)/g,
		replacement: '$1Base',
	},
];

/**
 * 🧩 Infiere la entidad basado en la ruta del archivo
 */
function inferEntityFromPath(filePath) {
	// Extraer nombre del directorio de transformador
	const matches = filePath.match(/transformers\/([^/\\]+)/);
	if (matches && matches[1]) {
		const entity = matches[1];
		// Manejar casos particulares
		switch (entity) {
			case 'album':
				return 'Album';
			case 'character':
				return 'Character';
			case 'collection':
				return 'Collection';
			case 'concept':
				return 'Concept';
			case 'favorite':
				return 'Favorite';
			case 'file':
				return 'File';
			case 'folder':
				return 'Folder';
			case 'group':
				return 'Group';
			case 'image':
				return 'Image';
			case 'note':
				return 'Note';
			case 'place':
				return 'Place';
			case 'profile':
				return 'Profile';
			case 'prompt':
				return 'Prompt';
			case 'property':
				return 'Property';
			case 'queue-job':
				return 'QueueJob';
			case 'tag':
				return 'Tag';
			case 'task':
				return 'Task';
			case 'uploaded-image':
				return 'UploadedImage';
			case 'video':
				return 'Video';
			case 'wildcard':
				return 'Wildcard';
			case 'world-item':
				return 'WorldItem';
			default:
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
	console.log('🚀 Iniciando corrección de transformadores...');

	// Inicializar log
	fs.writeFileSync(RESULTS_FILE, `Inicio: ${new Date().toLocaleString()}\n`, 'utf8');

	try {
		// Buscar archivos
		const files = await glob(`${TRANSFORMERS_DIR}/**/*.{ts,tsx}`);
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
