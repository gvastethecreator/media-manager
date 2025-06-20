/**
 * @file Script para actualizar importaciones a tipos canónicos
 *
 * Este script busca y reemplaza todas las importaciones de tipos legacy
 * con las versiones canónicas del archivo index.ts
 *
 * Uso: node scripts/fix-imports.js [entidad]
 * Ejemplo: node scripts/fix-imports.js tag
 */

const fs = require('fs');
const path = require('path');

// Obtener la entidad de los argumentos de línea de comandos
const entity = process.argv[2]?.toLowerCase() || 'tag';
console.log(`🔧 Corrección de importaciones para entidad: ${entity}`);

// Configuración
const baseDir = process.cwd();
const srcDir = path.join(baseDir, 'src');

// Define mapeos de tipos antiguos a nuevos según la entidad
const typeMap = {
	tag: {
		Tag: 'TagBase',
		TagExtended: 'TagWithRelations',
		CreateTagData: 'TagCreateInput',
		UpdateTagData: 'TagUpdateInput',
	},
	profile: {
		Profile: 'ProfileBase',
		ProfileExtended: 'ProfileBase',
		CreateProfileData: 'ProfileCreateInput',
		UpdateProfileData: 'ProfileUpdateInput',
	},
	// Añadir más entidades según sea necesario
};

// Patrón para buscar archivos
const findFiles = (dir, fileList = []) => {
	const files = fs.readdirSync(dir);

	files.forEach((file) => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
			findFiles(filePath, fileList);
		} else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts')) {
			const content = fs.readFileSync(filePath, 'utf8');
			const regex = new RegExp(`from\\s+['"]@/types/entities/${entity}/(enums|base|extended|types)['"]`, 'g');

			if (regex.test(content)) {
				fileList.push(filePath);
			}
		}
	});

	return fileList;
};

// Encontrar archivos con importaciones legacy
console.log('🔍 Buscando archivos...');
const filesToProcess = findFiles(srcDir);

console.log(`📝 Encontrados ${filesToProcess.length} archivos para procesar`);

// Obtener mapa de tipos para la entidad actual
const currentTypeMap = typeMap[entity] || {};
const importRegex = new RegExp(
	`import\\s+(?:{([^}]*)})\\s*from\\s+['"]@/types/entities/${entity}/(enums|base|extended|types)['"]`,
	'g'
);

// Procesar cada archivo
let totalReplacements = 0;

filesToProcess.forEach((file) => {
	try {
		let content = fs.readFileSync(file, 'utf8');
		let replacements = 0;

		// 1. Recopilar todas las importaciones
		const imports = new Set();

		content = content.replace(importRegex, (_match, importGroup, _importSource) => {
			if (importGroup) {
				importGroup.split(',').forEach((imp) => {
					const trimmed = imp.trim();
					imports.add(trimmed);
				});
			}
			replacements++;
			return ''; // Eliminar la importación original
		});

		// 2. Reemplazar tipos antiguos por nuevos
		Object.entries(currentTypeMap).forEach(([oldType, newType]) => {
			const oldTypeRegex = new RegExp(`\\b${oldType}\\b`, 'g');
			const oldCount = (content.match(oldTypeRegex) || []).length;
			content = content.replace(oldTypeRegex, newType);
			replacements += oldCount;
		});

		// 3. Agregar nueva importación consolidada
		if (imports.size > 0) {
			const typeImports = [];
			const valueImports = [];

			imports.forEach((imp) => {
				if (imp.includes('type')) {
					typeImports.push(imp);
				} else {
					valueImports.push(imp);
				}
			});

			let newImports = '';
			if (typeImports.length > 0) {
				newImports += `import type { ${typeImports.join(', ')} } from '@/types/entities/${entity}';\n`;
			}

			if (valueImports.length > 0) {
				newImports += `import { ${valueImports.join(', ')} } from '@/types/entities/${entity}';\n`;
			}

			content = newImports + content;
		}

		// Guardar los cambios
		if (replacements > 0) {
			fs.writeFileSync(file, content, 'utf8');
			console.log(`✅ ${file}: ${replacements} reemplazos`);
			totalReplacements += replacements;
		}
	} catch (error) {
		console.error(`❌ Error procesando ${file}:`, error);
	}
});

console.log(`🎉 Proceso completado: ${totalReplacements} reemplazos en ${filesToProcess.length} archivos`);
