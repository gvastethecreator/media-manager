/**
 * 🏗️ Generador de tipos canónicos para entidades
 *
 * Este script genera automáticamente los tipos canónicos para las entidades del sistema:
 * - Analiza el esquema de Prisma
 * - Crea directorios de tipos si no existen
 * - Genera los archivos types.ts, extended.ts, transformer.ts e index.ts
 * - Actualiza tipos comunes en common-refs.ts
 */

const fs = require('fs');
const path = require('path');

// 📁 Configuración
const TYPES_DIR = 'd:\\DEV\\image-manager\\src\\types\\entities';
const PRISMA_SCHEMA_PATH = 'd:\\DEV\\image-manager\\prisma\\schema.prisma';
const COMMON_REFS_PATH = path.join(TYPES_DIR, 'common-refs.ts');
const RESULTS_FILE = path.join(__dirname, 'canonical-types-generation.log');
const ENTITY_FIELDS_TO_OMIT = ['createdAt', 'updatedAt', 'deletedAt', 'isDeleted'];

// 📊 Estadísticas
let entitiesProcessed = 0;
let filesCreated = 0;
let errors = 0;

// 📝 Lista de entidades y sus campos
const entities = [];
const commonReferences = new Set();

/**
 * 📂 Asegura que un directorio exista
 */
function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
		console.log(`📁 Directorio creado: ${dir}`);
	}
}

/**
 * 📝 Escribe un archivo solo si no existe o ha cambiado
 */
function writeFileIfChanged(filePath, content) {
	let existing = '';
	let exists = false;

	try {
		if (fs.existsSync(filePath)) {
			existing = fs.readFileSync(filePath, 'utf8');
			exists = true;
		}
	} catch (e) {
		// El archivo no existe, lo crearemos
	}

	// Solo escribimos si el contenido ha cambiado
	if (!exists || existing !== content) {
		fs.writeFileSync(filePath, content, 'utf8');
		filesCreated++;
		console.log(`✅ ${exists ? 'Actualizado' : 'Creado'}: ${filePath}`);
		return true;
	}

	return false;
}

/**
 * 🔍 Lee y analiza el esquema de Prisma
 */
function parsePrismaSchema() {
	console.log('🔍 Analizando esquema Prisma...');

	try {
		const schema = fs.readFileSync(PRISMA_SCHEMA_PATH, 'utf8');
		const modelRegex = /model\s+(\w+)\s+{([^}]+)}/g;
		const fieldRegex = /^\s*(\w+)\s+(\w+)(?:\?|\[\])?(?:\s+@[^)]+)?/gm;

		let modelMatch;
		while ((modelMatch = modelRegex.exec(schema)) !== null) {
			const modelName = modelMatch[1];
			const modelFields = modelMatch[2];

			console.log(`📋 Procesando modelo: ${modelName}`);

			// Extraer campos del modelo
			const fields = [];
			let fieldMatch;
			while ((fieldMatch = fieldRegex.exec(modelFields)) !== null) {
				const fieldName = fieldMatch[1];
				const fieldType = fieldMatch[2];

				fields.push({ name: fieldName, type: fieldType });
			}

			// Añadir a la lista de entidades
			entities.push({
				name: modelName,
				fields,
			});
		}

		console.log(`📊 Encontrados ${entities.length} modelos en el esquema Prisma.`);
	} catch (error) {
		console.error('❌ Error analizando esquema Prisma:', error);
		throw error;
	}
}

/**
 * 🏗️ Genera los tipos canónicos para una entidad
 */
function generateCanonicalTypesForEntity(entity) {
	const entityName = entity.name;
	const entityNameLower = entityName.toLowerCase();
	const entityDir = path.join(TYPES_DIR, entityNameLower);

	console.log(`🏗️ Generando tipos para entidad: ${entityName}`);

	// Asegurar que existe el directorio
	ensureDir(entityDir);

	// Generar types.ts
	const typesContent = generateTypesFile(entity);
	writeFileIfChanged(path.join(entityDir, 'types.ts'), typesContent);

	// Generar extended.ts
	const extendedContent = generateExtendedFile(entity);
	writeFileIfChanged(path.join(entityDir, 'extended.ts'), extendedContent);

	// Generar transformer.ts
	const transformerContent = generateTransformerFile(entity);
	writeFileIfChanged(path.join(entityDir, 'transformer.ts'), transformerContent);

	// Generar index.ts
	const indexContent = generateIndexFile(entity);
	writeFileIfChanged(path.join(entityDir, 'index.ts'), indexContent);

	// Añadir a referencias comunes si aplica
	addToCommonReferences(entity);

	entitiesProcessed++;
}

/**
 * 📝 Genera el archivo types.ts
 */
function generateTypesFile(entity) {
	const entityName = entity.name;

	return `/**
 * @file Tipos para la entidad ${entityName}
 * @module types/entities/${entityName.toLowerCase()}/types
 */

import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import {
  EntityReference,
  EntityReferenceWithColor,
  EntityReferenceWithEmoji,
  EntityReferenceWithColorAndEmoji,
} from '@/types/entities/common-refs';
import { z } from 'zod';

/**
 * 🔍 Esquema de validación para ${entityName}
 */
export const ${entityName}Schema = z.object({
  ...BaseEntitySchema.shape,
  ...UIFieldsSchema.shape,
  ...MetadataFieldsSchema.shape,
${entity.fields
	.filter((field) => !ENTITY_FIELDS_TO_OMIT.includes(field.name))
	.map((field) => {
		if (field.type === 'String') {
			return `  ${field.name}: z.string()${field.name === 'id' ? '' : '.nullable()'},`;
		} else if (field.type === 'Int' || field.type === 'Float') {
			return `  ${field.name}: z.number()${field.name === 'id' ? '' : '.nullable()'},`;
		} else if (field.type === 'Boolean') {
			return `  ${field.name}: z.boolean(),`;
		} else if (field.type === 'DateTime') {
			return `  ${field.name}: z.date().nullable(),`;
		} else if (field.type === 'Json') {
			return `  ${field.name}: z.any().nullable(),`;
		} else {
			return `  ${field.name}: z.any(),`;
		}
	})
	.join('\n')}
});

/**
 * 📋 Tipo base para ${entityName}
 */
export interface ${entityName}Base {
${entity.fields
	.filter((field) => !ENTITY_FIELDS_TO_OMIT.includes(field.name))
	.map((field) => {
		if (field.type === 'String') {
			return `  ${field.name}: string${field.name === 'id' ? '' : ' | null'};`;
		} else if (field.type === 'Int' || field.type === 'Float') {
			return `  ${field.name}: number${field.name === 'id' ? '' : ' | null'};`;
		} else if (field.type === 'Boolean') {
			return `  ${field.name}: boolean;`;
		} else if (field.type === 'DateTime') {
			return `  ${field.name}: Date | null;`;
		} else if (field.type === 'Json') {
			return `  ${field.name}: any | null;`;
		} else {
			return `  ${field.name}: any;`;
		}
	})
	.join('\n')}
  
  // Campos comunes de entidad
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  isDeleted?: boolean;
}

/**
 * 📝 Datos para crear un ${entityName}
 */
export interface Create${entityName}Data {
${entity.fields
	.filter((field) => !['id', ...ENTITY_FIELDS_TO_OMIT].includes(field.name))
	.map((field) => {
		if (field.type === 'String') {
			return `  ${field.name}?: string | null;`;
		} else if (field.type === 'Int' || field.type === 'Float') {
			return `  ${field.name}?: number | null;`;
		} else if (field.type === 'Boolean') {
			return `  ${field.name}?: boolean;`;
		} else if (field.type === 'DateTime') {
			return `  ${field.name}?: Date | null;`;
		} else if (field.type === 'Json') {
			return `  ${field.name}?: any | null;`;
		} else {
			return `  ${field.name}?: any;`;
		}
	})
	.join('\n')}
}

/**
 * 📝 Datos para actualizar un ${entityName}
 */
export interface Update${entityName}Data {
  id: string;
${entity.fields
	.filter((field) => !['id', ...ENTITY_FIELDS_TO_OMIT].includes(field.name))
	.map((field) => {
		if (field.type === 'String') {
			return `  ${field.name}?: string | null;`;
		} else if (field.type === 'Int' || field.type === 'Float') {
			return `  ${field.name}?: number | null;`;
		} else if (field.type === 'Boolean') {
			return `  ${field.name}?: boolean;`;
		} else if (field.type === 'DateTime') {
			return `  ${field.name}?: Date | null;`;
		} else if (field.type === 'Json') {
			return `  ${field.name}?: any | null;`;
		} else {
			return `  ${field.name}?: any;`;
		}
	})
	.join('\n')}
}

/**
 * 🔍 Filtros para ${entityName}
 */
export interface ${entityName}Filters {
  id?: string;
  ids?: string[];
  name?: string;
  search?: string;
  // Añade otros filtros específicos aquí
}
`;
}

/**
 * 📝 Genera el archivo extended.ts
 */
function generateExtendedFile(entity) {
	const entityName = entity.name;

	return `/**
 * @file Tipos extendidos para la entidad ${entityName}
 * @module types/entities/${entityName.toLowerCase()}/extended
 */

import { ${entityName}Base } from './types';

/**
 * 📋 ${entityName} con relaciones extendidas
 */
export interface ${entityName}Extended extends ${entityName}Base {
  // Añadir relaciones extendidas aquí según el esquema de la entidad
}

/**
 * 🔗 ${entityName} con relaciones completas
 */
export interface ${entityName}WithRelations extends ${entityName}Extended {
  // Añadir relaciones adicionales aquí para casos con todos los includes
}
`;
}

/**
 * 📝 Genera el archivo transformer.ts
 */
function generateTransformerFile(entity) {
	const entityName = entity.name;
	const entityNameLower = entityName.toLowerCase();

	return `/**
 * @file Transformer para la entidad ${entityName}
 * @module types/entities/${entityNameLower}/transformer
 */

import { ${entityName}Base, ${entityName}Extended, Create${entityName}Data, Update${entityName}Data } from './types';

/**
 * 🔄 Transformer para ${entityName}
 */
export const ${entityNameLower}Transformer = {
  /**
   * 📥 Convierte un registro de Prisma a nuestro tipo canónico
   */
  fromDB: (data: any): ${entityName}Base => {
    if (!data) return null;
    
    return {
      id: data.id,
      ${entity.fields
				.filter((field) => !['id', ...ENTITY_FIELDS_TO_OMIT].includes(field.name))
				.map((field) => `${field.name}: data.${field.name},`)
				.join('\n      ')}
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      isDeleted: data.isDeleted ?? false,
    };
  },
  
  /**
   * 📤 Prepara los datos para enviar a Prisma
   */
  toDB: (data: Create${entityName}Data | Update${entityName}Data): any => {
    const result: any = {};
    
    // Solo copiamos las propiedades que existen en el objeto origen
    if (data.id !== undefined) result.id = data.id;
    ${entity.fields
			.filter((field) => !['id', ...ENTITY_FIELDS_TO_OMIT].includes(field.name))
			.map((field) => `if (data.${field.name} !== undefined) result.${field.name} = data.${field.name};`)
			.join('\n    ')}
    
    return result;
  },
  
  /**
   * 🔄 Convierte a la vista para el cliente, incluyendo relaciones
   */
  toClient: (data: any): ${entityName}Extended => {
    if (!data) return null;
    
    const base = ${entityNameLower}Transformer.fromDB(data);
    
    return {
      ...base,
      // Aquí se mapean las relaciones cuando existan
    };
  },
  
  /**
   * ✅ Valida los datos de entrada
   */
  validate: (data: any): ${entityName}Base => {
    // Implementa la validación según tu lógica de negocio
    return data;
  }
};
`;
}

/**
 * 📝 Genera el archivo index.ts
 */
function generateIndexFile(entity) {
	const entityName = entity.name;

	return `/**
 * @file Índice de exportación para la entidad ${entityName}
 * @module types/entities/${entityName.toLowerCase()}
 */

export * from './types';
export * from './extended';
export * from './transformer';
`;
}

/**
 * 📝 Añade la entidad a las referencias comunes si aplica
 */
function addToCommonReferences(entity) {
	// Comprobamos si la entidad debería tener una referencia común
	const name = entity.name;
	const fields = entity.fields.map((f) => f.name);

	// Referencia básica (id + name)
	if (fields.includes('id') && fields.includes('name')) {
		commonReferences.add(`${name}Reference`);
	}

	// Referencia con color
	if (fields.includes('id') && fields.includes('name') && fields.includes('color')) {
		commonReferences.add(`${name}ReferenceWithColor`);
	}

	// Referencia con emoji
	if (fields.includes('id') && fields.includes('name') && fields.includes('emoji')) {
		commonReferences.add(`${name}ReferenceWithEmoji`);
	}

	// Referencia con color y emoji
	if (fields.includes('id') && fields.includes('name') && fields.includes('color') && fields.includes('emoji')) {
		commonReferences.add(`${name}ReferenceWithColorAndEmoji`);
	}
}

/**
 * 📝 Actualiza el archivo de referencias comunes
 */
function updateCommonReferences() {
	console.log('📝 Actualizando referencias comunes...');

	// Leer archivo actual de referencias comunes
	let content = '';
	if (fs.existsSync(COMMON_REFS_PATH)) {
		content = fs.readFileSync(COMMON_REFS_PATH, 'utf8');
	} else {
		// Crear archivo con cabecera
		content = `/**
 * @file Tipos de referencia comunes para entidades
 * @module types/entities/common-refs
 */

`;
	}

	// Comprobar si ya existen las interfaces básicas
	if (!content.includes('interface EntityReference')) {
		content += `
/**
 * 🏷️ Referencia básica a una entidad
 */
export interface EntityReference {
  id: string;
  name: string;
}

/**
 * 🎨 Referencia a una entidad con color
 */
export interface EntityReferenceWithColor extends EntityReference {
  color?: string;
}

/**
 * 😀 Referencia a una entidad con emoji
 */
export interface EntityReferenceWithEmoji extends EntityReference {
  emoji?: string;
}

/**
 * 🌈 Referencia a una entidad con color y emoji
 */
export interface EntityReferenceWithColorAndEmoji extends EntityReference {
  color?: string;
  emoji?: string;
}
`;
	}

	// Añadir referencias específicas de entidades
	commonReferences.forEach((ref) => {
		if (!content.includes(`interface ${ref}`)) {
			const baseInterface =
				ref.includes('WithColor') && ref.includes('WithEmoji')
					? 'EntityReferenceWithColorAndEmoji'
					: ref.includes('WithColor')
						? 'EntityReferenceWithColor'
						: ref.includes('WithEmoji')
							? 'EntityReferenceWithEmoji'
							: 'EntityReference';

			content += `
/**
 * 🔖 ${ref}
 */
export interface ${ref} extends ${baseInterface} {
  // Campos específicos de la entidad
}
`;
		}
	});

	// Guardar archivo actualizado
	writeFileIfChanged(COMMON_REFS_PATH, content);
}

/**
 * 🚀 Función principal
 */
async function main() {
	console.log('🚀 Iniciando generación de tipos canónicos');

	// Inicializar archivo de log
	fs.writeFileSync(RESULTS_FILE, `# Log de generación de tipos canónicos\n\nIniciado: ${new Date().toISOString()}\n\n`);

	try {
		// Asegurar que existe el directorio raíz
		ensureDir(TYPES_DIR);

		// Analizar esquema de Prisma
		parsePrismaSchema();

		// Procesar cada entidad
		for (const entity of entities) {
			try {
				generateCanonicalTypesForEntity(entity);
			} catch (error) {
				console.error(`❌ Error procesando entidad ${entity.name}:`, error);
				fs.appendFileSync(
					RESULTS_FILE,
					`[${new Date().toISOString()}] ERROR en entidad ${entity.name}: ${error.message}\n`
				);
				errors++;
			}
		}

		// Actualizar referencias comunes
		updateCommonReferences();

		// Resumen
		const summary = `
# Resumen de generación de tipos canónicos
- Entidades procesadas: ${entitiesProcessed}
- Archivos creados/actualizados: ${filesCreated}
- Errores: ${errors}

Finalizado: ${new Date().toISOString()}
`;

		fs.appendFileSync(RESULTS_FILE, summary);
		console.log(summary);

		return { entitiesProcessed, filesCreated, errors };
	} catch (error) {
		console.error('❌ Error general:', error);
		fs.appendFileSync(RESULTS_FILE, `\n## ERROR FATAL\n${error.stack}\n`);
		return { entitiesProcessed, filesCreated, errors: errors + 1 };
	}
}

// Ejecutar si se llama directamente
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { main, parsePrismaSchema, generateCanonicalTypesForEntity };
