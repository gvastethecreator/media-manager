/**
 * 🚀 Script avanzado para corregir errores en transformadores
 *
 * Este script analiza y corrige automáticamente problemas comunes en los transformadores:
 * - Reemplaza importaciones directas de Prisma
 * - Actualiza tipos de Prisma a tipos canónicos
 * - Corrige funciones fromDB, toDB y validate
 * - Actualiza índices para exportaciones correctas
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 📁 Configuración
const TRANSFORMERS_DIR = 'd:\\DEV\\image-manager\\src\\transformers';
const TYPES_DIR = 'd:\\DEV\\image-manager\\src\\types\\entities';
const RESULTS_FILE = path.join(__dirname, 'transformer-fixes.log');
const ENTITIES_MAP = {
	activity: 'Activity',
	album: 'Album',
	character: 'Character',
	collection: 'Collection',
	concept: 'Concept',
	favorite: 'Favorite',
	file: 'File',
	folder: 'Folder',
	group: 'Group',
	image: 'Image',
	metadata: 'Metadata',
	note: 'Note',
	place: 'Place',
	profile: 'Profile',
	prompt: 'Prompt',
	property: 'Property',
	queuejob: 'QueueJob',
	setting: 'Setting',
	stats: 'Stats',
	tag: 'Tag',
	task: 'Task',
	uploadedimage: 'UploadedImage',
	video: 'Video',
	wildcard: 'Wildcard',
	worlditem: 'WorldItem',
};

// 📊 Estadísticas
let filesScanned = 0;
let filesModified = 0;
let errors = 0;
const entityStats = {};

// 🔎 Patrones de reemplazo
const REPLACEMENTS = [
	// 1. Reemplazar importaciones de Prisma
	{
		pattern:
			/import\s+(?:{[^}]*?(?:type\s+)?(?:Prisma|\w+)(?:\s+as\s+\w+)?[^}]*?}|[^{}\n]+?(?:type\s+)?(?:Prisma|\w+)(?:\s+as\s+\w+)?)\s+from\s+['"]@prisma\/client['"]/g,
		replacement: (match, filePath) => {
			const entity = inferEntityFromPath(filePath);
			if (!entity) {
				return `// TODO: Reemplazar con tipos canónicos
${match}`;
			}

			// Extraemos los tipos importados
			const importMatches = match.match(/{([^}]*)}/);
			if (importMatches) {
				const imports = importMatches[1].split(',').map((i) => i.trim());
				const prismaImports = imports.filter((i) => i.includes('Prisma') || ENTITIES_MAP[i.toLowerCase()]);

				if (prismaImports.length > 0) {
					return `// Usar tipos canónicos en lugar de Prisma
import type { ${entity}Base, ${entity}Extended, Create${entity}Data, Update${entity}Data } from '@/types/entities/${entity.toLowerCase()}'`;
				}
			}

			return `// Usar tipos canónicos en lugar de Prisma
import type { ${entity}Base, ${entity}Extended } from '@/types/entities/${entity.toLowerCase()}'`;
		},
	},

	// 2. Reemplazar interfaces duplicadas con tipos canónicos
	{
		pattern:
			/export\s+(?:interface|type)\s+(\w+)(?:Base|Extended|CreateData|UpdateData|Input|Output|Response)\s*(?:<[^>]*>)?\s*(?:extends\s+[^{]+)?\s*{[^}]+}/gs,
		replacement: (match, entity, offset, string, filePath) => {
			const entityName = inferEntityFromMatch(match, filePath);
			if (!entityName) return match;

			// Comprobamos si es un tipo que debería ser importado desde tipos canónicos
			const typeMatch = match.match(
				/export\s+(?:interface|type)\s+(\w+)(Base|Extended|CreateData|UpdateData|Input|Output|Response)/
			);
			if (typeMatch) {
				const [_, base, suffix] = typeMatch;

				// Si coincide con el patrón de tipo canónico, reemplazamos
				if (base === entityName || base === entityName + 'Type') {
					// Añadir comentario para explicar lo que estamos haciendo
					return `// Se usa el tipo canónico importado de '@/types/entities/${entityName.toLowerCase()}'`;
				}
			}

			return match;
		},
	},

	// 3. Reemplazar tipos Prisma en funciones fromDB/toDB
	{
		pattern:
			/(export\s+(?:function|const)\s+(?:fromDB|toDB)\s*=\s*(?:\([^)]*\)|function\s*\([^)]*\)))\s*:\s*(?:Prisma\.)?(\w+)(?:GetPayload<[^>]*>)?/g,
		replacement: (match, fnDef, prismaType, filePath) => {
			const entity = inferEntityFromPath(filePath) || inferEntityFromPrismaType(prismaType);

			if (entity && fnDef.includes('fromDB')) {
				return `${fnDef}: ${entity}Base`;
			} else if (entity && fnDef.includes('toDB')) {
				return `${fnDef}: any`; // Temporalmente 'any', luego será reemplazado en una pasada más específica
			}

			return match;
		},
	},

	// 4. Reemplazar tipado en funciones validate
	{
		pattern:
			/(export\s+(?:function|const)\s+validate\s*=\s*(?:\([^)]*\)|function\s*\([^)]*\)))\s*:\s*(?:Prisma\.)?(\w+)(?:GetPayload<[^>]*>)?/g,
		replacement: (match, fnDef, prismaType, filePath) => {
			const entity = inferEntityFromPath(filePath) || inferEntityFromPrismaType(prismaType);

			if (entity) {
				return `${fnDef}: ${entity}Base`;
			}

			return match;
		},
	},

	// 5. Reemplazar Promise<unknown> o Promise<void> por Promise<TipoCanónico>
	{
		pattern: /Promise<(unknown|void)>/g,
		replacement: (match, type, offset, string, filePath) => {
			const entity = inferEntityFromPath(filePath);

			if (entity) {
				// Analizamos el contexto para decidir el tipo de retorno apropiado
				const functionContext = string.substring(Math.max(0, offset - 100), offset + 100);

				if (functionContext.includes('get') || functionContext.includes('find')) {
					return `Promise<${entity}Base | null>`;
				} else if (functionContext.includes('create') || functionContext.includes('update')) {
					return `Promise<${entity}Base>`;
				} else if (functionContext.includes('delete')) {
					return `Promise<void>`;
				} else if (functionContext.includes('list') || functionContext.includes('getAll')) {
					return `Promise<${entity}Base[]>`;
				}
			}

			return match;
		},
	},

	// 6. Reemplazar funciones fromDB/toDB para usar tipos canónicos
	{
		pattern:
			/(export\s+(?:function|const)\s+fromDB\s*=\s*(?:\(.*?\)|function\s*\(.*?\)))\s*(?:=>|{)[\s\S]*?(?:return|\})/g,
		replacement: (match, fnDef, filePath) => {
			const entity = inferEntityFromPath(filePath);
			if (!entity) return match;

			// Si incluye un return explícito, mantenemos la estructura pero adaptamos el tipo
			if (match.includes('return')) {
				return match.replace(
					/(export\s+(?:function|const)\s+fromDB\s*=\s*(?:\(.*?\)|function\s*\(.*?\)))\s*(?:=>|{)/,
					`$1: ${entity}Base =>`
				);
			}

			return match;
		},
	},

	// 7. Reemplazar funciones toDB para usar tipos canónicos
	{
		pattern:
			/(export\s+(?:function|const)\s+toDB\s*=\s*(?:\(.*?\)|function\s*\(.*?\)))\s*(?:=>|{)[\s\S]*?(?:return|\})/g,
		replacement: (match, fnDef, filePath) => {
			const entity = inferEntityFromPath(filePath);
			if (!entity) return match;

			// Si incluye un return explícito, mantenemos la estructura pero adaptamos el tipo
			if (match.includes('return')) {
				return match.replace(
					/(export\s+(?:function|const)\s+toDB\s*=\s*(?:\(.*?\)|function\s*\(.*?\)))\s*(?:=>|{)/,
					`$1: any =>`
				);
			}

			return match;
		},
	},
];

/**
 * 🔍 Infiere la entidad desde la ruta del archivo
 */
function inferEntityFromPath(filePath) {
	if (!filePath) return null;

	// Asegurarnos de que filePath sea una cadena
	const filePathString = String(filePath);

	// Primero intentamos con el directorio padre
	const dirMatch = filePathString.match(/[/\\]([\w-]+)[/\\][^/\\]+$/);
	if (dirMatch) {
		const entityDir = dirMatch[1].toLowerCase();

		// Comprobamos si existe un mapeo para esta entidad
		if (ENTITIES_MAP[entityDir]) {
			return ENTITIES_MAP[entityDir];
		}

		// Tratamos casos especiales como "uploaded-images" -> "UploadedImage"
		if (entityDir.includes('-')) {
			const parts = entityDir.split('-');
			const camelCased = parts
				.map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
				.join('');

			if (ENTITIES_MAP[camelCased]) {
				return ENTITIES_MAP[camelCased];
			}
		}

		// Como último recurso, capitalizamos la primera letra
		return entityDir.charAt(0).toUpperCase() + entityDir.slice(1);
	}
	// Si no podemos inferir del directorio, intentamos con el nombre del archivo
	const fileMatch = filePathString.match(/[/\\]([\w-]+)(?:\.transformer)?\.ts$/);
	if (fileMatch) {
		const entityName = fileMatch[1].toLowerCase();

		if (ENTITIES_MAP[entityName]) {
			return ENTITIES_MAP[entityName];
		}

		// Tratamos nombres compuestos
		if (entityName.includes('-')) {
			const parts = entityName.split('-');
			const camelCased = parts
				.map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
				.join('');

			if (ENTITIES_MAP[camelCased]) {
				return ENTITIES_MAP[camelCased];
			}
		}

		return entityName.charAt(0).toUpperCase() + entityName.slice(1);
	}

	return null;
}

/**
 * 🔍 Infiere la entidad desde el tipo de Prisma
 */
function inferEntityFromPrismaType(prismaType) {
	if (!prismaType) return null;

	// Buscamos en el mapa de entidades
	const entityKey = prismaType.toLowerCase();
	if (ENTITIES_MAP[entityKey]) {
		return ENTITIES_MAP[entityKey];
	}

	return prismaType;
}

/**
 * 🔍 Infiere la entidad desde una coincidencia de texto
 */
function inferEntityFromMatch(match, filePath) {
	// Primero probamos con la ruta del archivo
	const entityFromPath = inferEntityFromPath(filePath);
	if (entityFromPath) return entityFromPath;

	// Luego intentamos extraer del propio match
	const typeMatch = match.match(
		/export\s+(?:interface|type)\s+(\w+)(?:Base|Extended|CreateData|UpdateData|Input|Output|Response)/
	);
	if (typeMatch) {
		const typeName = typeMatch[1];
		// Eliminamos sufijos comunes para obtener la entidad base
		const baseEntity = typeName.replace(/(Base|Extended|CreateData|UpdateData|Input|Output|Response|Type)$/, '');

		// Buscamos en el mapa de entidades
		const entityKey = baseEntity.toLowerCase();
		if (ENTITIES_MAP[entityKey]) {
			return ENTITIES_MAP[entityKey];
		}

		return baseEntity;
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

		// Inferir entidad
		const entity = inferEntityFromPath(filePath);
		if (entity) {
			// Inicializar estadísticas para esta entidad si no existen
			if (!entityStats[entity]) {
				entityStats[entity] = { files: 0, modifications: 0 };
			}
			entityStats[entity].files++;
		}

		// Aplicar reemplazos
		for (const { pattern, replacement } of REPLACEMENTS) {
			newContent = newContent.replace(pattern, (...args) => {
				// Añadir la ruta del archivo como último argumento
				args.push(filePath);
				const result = typeof replacement === 'function' ? replacement(...args) : replacement;

				if (args[0] !== result) {
					modified = true;
					if (entity) {
						entityStats[entity].modifications = (entityStats[entity].modifications || 0) + 1;
					}
				}

				return result;
			});
		}

		// Guardar si hay cambios
		if (modified) {
			fs.writeFileSync(filePath, newContent, 'utf8');
			console.log(`✅ Archivo modificado: ${filePath}`);
			filesModified++;

			// Registrar en log
			const logEntry = `[${new Date().toISOString()}] Corregido: ${filePath}\n`;
			fs.appendFileSync(RESULTS_FILE, logEntry);
		}
	} catch (error) {
		console.error(`❌ Error procesando ${filePath}:`, error);
		errors++;

		// Registrar error
		const errorLog = `[${new Date().toISOString()}] ERROR en ${filePath}: ${error.message}\n`;
		fs.appendFileSync(RESULTS_FILE, errorLog);
	}
}

/**
 * 🚀 Función principal
 */
async function main() {
	console.log('🔧 Iniciando corrección de transformadores');

	// Inicializar archivo de log
	fs.writeFileSync(
		RESULTS_FILE,
		`# Log de correcciones de transformadores\n\nIniciado: ${new Date().toISOString()}\n\n`
	);

	try {
		// Buscar archivos de transformadores
		const files = await glob('**/*.{ts,tsx}', {
			cwd: TRANSFORMERS_DIR,
			absolute: true,
		});

		// Procesar archivos
		for (const file of files) {
			await processFile(file);
		}

		// Resumen
		const summary = `
# Resumen de correcciones
- Archivos escaneados: ${filesScanned}
- Archivos modificados: ${filesModified}
- Errores: ${errors}

## Estadísticas por entidad
${Object.entries(entityStats)
	.map(([entity, stats]) => `- ${entity}: ${stats.files} archivos, ${stats.modifications} modificaciones`)
	.join('\n')}

Finalizado: ${new Date().toISOString()}
`;

		fs.appendFileSync(RESULTS_FILE, summary);
		console.log(summary);

		return { filesScanned, filesModified, errors, entityStats };
	} catch (error) {
		console.error('❌ Error general:', error);
		fs.appendFileSync(RESULTS_FILE, `\n## ERROR FATAL\n${error.stack}\n`);
		return { filesScanned, filesModified, errors: errors + 1, entityStats };
	}
}

// Ejecutar si se llama directamente
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { main, processFile };
