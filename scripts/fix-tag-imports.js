/**
 * @file Script para actualizar importaciones de Tag a tipos canónicos
 *
 * Este script busca y reemplaza todas las importaciones de tipos legacy de Tag
 * con las versiones canónicas del archivo index.ts
 *
 * Uso: node scripts/fix-tag-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const baseDir = process.cwd();
const importRegex = /import\s+(?:{([^}]*)})?\s*from\s+['"]@\/types\/entities\/tag\/(enums|base|extended|types)['"]/g;
const _typeRegex = /\bTag(?:Complete|Base|Extended|WithRelations|CreateInput|UpdateInput)\b/g;

// Define mapeos de tipos antiguos a nuevos
const typeMap = {
	Tag: 'TagBase',
	TagExtended: 'TagWithRelations',
	CreateTagData: 'TagCreateInput',
	UpdateTagData: 'TagUpdateInput',
};

// Encontrar archivos TypeScript con importaciones de Tag
console.log('🔍 Buscando archivos con importaciones de Tag...');
const grepResult = execSync('grep -l -r --include="*.ts" --include="*.tsx" "from \'@/types/entities/tag/" .', {
	encoding: 'utf8',
});

const filesToProcess = grepResult
	.split('\n')
	.filter(Boolean)
	.map((file) => path.resolve(baseDir, file));

console.log(`📝 Encontrados ${filesToProcess.length} archivos para procesar`);

// Procesar cada archivo
let totalReplacements = 0;
filesToProcess.forEach((file) => {
	try {
		let content = fs.readFileSync(file, 'utf8');
		let replacements = 0;

		// 1. Combinar múltiples importaciones
		const imports = new Set();
		let _hasEnumImports = false;
		let _hasTypeImports = false;

		content = content.replace(importRegex, (_match, importGroup, _importSource) => {
			if (importGroup) {
				importGroup.split(',').forEach((imp) => {
					const trimmed = imp.trim();
					if (trimmed.includes('type')) {
						_hasTypeImports = true;
						imports.add(trimmed);
					} else if (['TagCategory', 'TagRarity', 'TagSortCriteria', 'TagViewMode'].includes(trimmed)) {
						_hasEnumImports = true;
						imports.add(trimmed);
					} else {
						imports.add(trimmed);
					}
				});
			}
			replacements++;
			return ''; // Eliminar la importación original
		});

		// 2. Reemplazar tipos antiguos por nuevos
		Object.entries(typeMap).forEach(([oldType, newType]) => {
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
				newImports += `import type { ${typeImports.join(', ')} } from '@/types/entities/tag';\n`;
			}

			if (valueImports.length > 0) {
				newImports += `import { ${valueImports.join(', ')} } from '@/types/entities/tag';\n`;
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
