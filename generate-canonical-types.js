/**
 * 🔄 Generador de tipos canónicos a partir del schema de Prisma
 *
 * Este script analiza el schema de Prisma y genera tipos TypeScript canónicos
 * para ser utilizados en la aplicación sin crear dependencias con Prisma
 * en componentes de cliente.
 */

const fs = require('fs');
const path = require('path');

// 📁 Configuración de rutas
const PRISMA_SCHEMA = path.join(__dirname, 'prisma/schema.prisma');
const TYPES_DIR = path.join(__dirname, 'src/types/entities');

// 📊 Estadísticas
const stats = {
	modelsProcessed: 0,
	typesGenerated: 0,
	errors: 0,
};

/**
 * 📝 Lee el schema de Prisma y extrae definiciones de modelos
 * @return {Object} Objeto con modelos y sus definiciones
 */
function parsePrismaSchema() {
	console.log('📖 Leyendo schema de Prisma...');
	const schemaContent = fs.readFileSync(PRISMA_SCHEMA, 'utf8');

	// Expresión regular para extraer modelos
	const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;
	const enumRegex = /enum\s+(\w+)\s*{([^}]*)}/g;

	const models = {};
	const enums = {};

	// Extraer modelos
	let modelMatch;
	while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
		const [, modelName, modelContent] = modelMatch;

		// Extraer campos
		const fields = [];
		const fieldLines = modelContent.trim().split('\n');

		for (const line of fieldLines) {
			const trimmedLine = line.trim();
			// Ignorar comentarios y líneas vacías
			if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('@@')) {
				continue;
			}

			// Analizar definición de campo
			const fieldMatch = trimmedLine.match(/(\w+)\s+(\w+)(\?)?\s*(?:@\w+(?:\(.*\))?)?/);
			if (fieldMatch) {
				const [, fieldName, fieldType, optional] = fieldMatch;
				fields.push({
					name: fieldName,
					type: fieldType,
					optional: Boolean(optional),
					raw: trimmedLine,
				});
			}
		}

		models[modelName] = {
			name: modelName,
			fields,
			raw: modelContent,
		};

		stats.modelsProcessed++;
	}

	// Extraer enums
	let enumMatch;
	while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
		const [, enumName, enumContent] = enumMatch;

		// Extraer valores del enum
		const values = enumContent
			.trim()
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('//'))
			.map((line) => line.replace(/\s+.*$/, ''));

		enums[enumName] = {
			name: enumName,
			values,
			raw: enumContent,
		};
	}

	return { models, enums };
}

/**
 * 🔄 Convierte un tipo Prisma a tipo TypeScript
 * @param {string} prismaType - Tipo en Prisma
 * @return {string} Tipo equivalente en TypeScript
 */
function mapPrismaTypeToTS(prismaType) {
	const typeMap = {
		String: 'string',
		Int: 'number',
		Float: 'number',
		Boolean: 'boolean',
		DateTime: 'Date',
		Json: 'Record<string, any>',
		Bytes: 'Buffer',
	};

	return typeMap[prismaType] || prismaType;
}

/**
 * 🎨 Genera un archivo de tipos para una entidad
 * @param {string} entityName - Nombre de la entidad
 * @param {Object} modelData - Datos del modelo
 * @param {Object} enums - Definición de enums
 */
function generateEntityTypes(entityName, modelData, enums) {
	console.log(`🔨 Generando tipos para: ${entityName}`);

	const typesDir = path.join(TYPES_DIR, entityName.toLowerCase());

	// Crear directorio si no existe
	if (!fs.existsSync(typesDir)) {
		fs.mkdirSync(typesDir, { recursive: true });
	}

	// Generar archivo de tipos básico
	const typesFile = path.join(typesDir, 'types.ts');

	// Contenido del archivo
	const content = `/**
 * @file Tipos para la entidad ${entityName}
 * @module types/entities/${entityName.toLowerCase()}/types
 */

import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';

/**
 * 🔍 Esquema de validación para ${entityName}
 */
export const ${entityName}Schema = z.object({
  ...BaseEntitySchema.shape,
  ...UIFieldsSchema.shape,
  ...MetadataFieldsSchema.shape,
${modelData.fields
	.map((field) => {
		const tsType = mapPrismaTypeToTS(field.type);
		const zodType = field.optional
			? `z.${tsType === 'string' ? 'string' : tsType === 'number' ? 'number' : tsType === 'boolean' ? 'boolean' : 'any'}().nullable()`
			: `z.${tsType === 'string' ? 'string' : tsType === 'number' ? 'number' : tsType === 'boolean' ? 'boolean' : 'any'}()`;
		return `  ${field.name}: ${zodType},`;
	})
	.join('\n')}
});

/**
 * 🔄 Tipo base para ${entityName}
 */
export interface ${entityName}Base {
${modelData.fields
	.map((field) => {
		const tsType = mapPrismaTypeToTS(field.type);
		return `  ${field.name}${field.optional ? '?' : ''}: ${tsType}${field.optional ? ' | null' : ''};`;
	})
	.join('\n')}
}

/**
 * 🌟 Tipo completo para ${entityName}
 */
export interface ${entityName} extends ${entityName}Base {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 🔍 Tipo para búsqueda de ${entityName}
 */
export interface ${entityName}SearchOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  query?: string;
  filters?: ${entityName}Filters;
}

/**
 * 🔍 Filtros para ${entityName}
 */
export interface ${entityName}Filters {
  id?: string | string[];
${modelData.fields
	.map((field) => {
		const tsType = mapPrismaTypeToTS(field.type);
		if (['string', 'number', 'boolean'].includes(tsType)) {
			return `  ${field.name}?: ${tsType}${field.optional ? ' | null' : ''};`;
		}
		return '';
	})
	.filter(Boolean)
	.join('\n')}
}

/**
 * ➕ Input para crear un ${entityName}
 */
export interface ${entityName}CreateInput extends Omit<${entityName}Base, 'id' | 'createdAt' | 'updatedAt'> {
  // Propiedades específicas para creación
}

/**
 * 🔄 Input para actualizar un ${entityName}
 */
export interface ${entityName}UpdateInput extends Partial<${entityName}CreateInput> {
  id: string;
}

/**
 * 🔗 ${entityName} con relaciones
 */
export interface ${entityName}WithRelations extends ${entityName} {
  // Añadir relaciones específicas
  // Ejemplo: tags: Tag[];
}
`;

	// Generar archivo de tipos
	fs.writeFileSync(typesFile, content, 'utf8');
	stats.typesGenerated++;

	// También crear index.ts para exportar
	const indexFile = path.join(typesDir, 'index.ts');
	const indexContent = `/**
 * @file Exportaciones de tipos para ${entityName}
 * @module types/entities/${entityName.toLowerCase()}
 */

export * from './types';
`;

	fs.writeFileSync(indexFile, indexContent, 'utf8');

	console.log(`✅ Generados tipos para ${entityName}`);
}

/**
 * 🚀 Función principal
 */
async function main() {
	console.log('🚀 Iniciando generación de tipos canónicos...');

	try {
		// Parsear schema de Prisma
		const { models, enums } = parsePrismaSchema();

		console.log(`📊 Encontrados ${Object.keys(models).length} modelos y ${Object.keys(enums).length} enums`);

		// Crear directorio raíz de tipos si no existe
		if (!fs.existsSync(TYPES_DIR)) {
			fs.mkdirSync(TYPES_DIR, { recursive: true });
		}

		// Generar tipos para cada modelo
		for (const [modelName, modelData] of Object.entries(models)) {
			generateEntityTypes(modelName, modelData, enums);
		}

		// Generar index.ts principal
		const mainIndexFile = path.join(TYPES_DIR, 'index.ts');
		const mainIndexContent = `/**
 * @file Índice de exportación de tipos de entidades
 * @module types/entities
 */

${Object.keys(models)
	.map((model) => `export * from './${model.toLowerCase()}';`)
	.join('\n')}

// También exportamos enums
${Object.keys(enums)
	.map((enumName, i) => {
		const values = enums[enumName].values;
		return `export enum ${enumName} {
${values.map((val) => `  ${val} = '${val}'`).join(',\n')}
}`;
	})
	.join('\n\n')}
`;

		fs.writeFileSync(mainIndexFile, mainIndexContent, 'utf8');

		console.log(`
📊 Resumen:
- 📝 Modelos procesados: ${stats.modelsProcessed}
- ✅ Tipos generados: ${stats.typesGenerated}
- ❌ Errores: ${stats.errors}
`);
	} catch (err) {
		console.error('❌ Error general:', err);
	}
}

// Ejecutar script
main();
