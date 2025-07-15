#!/usr/bin/env bun

/**
 * Script para corregir errores TypeScript críticos de forma sistemática
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const fixes = [
	{
		file: 'src/app/actions/tags/query.actions.ts',
		search:
			'const transformedTags = includeStats\n\t\t\t? tags.map(toTagWithStats)\n\t\t\t: tags.map(tag => ({\n\t\t\t\t...tag,\n\t\t\t\tstats: {\n\t\t\t\t\ttotalRelations: 0,\n\t\t\t\t\tusageDiversity: 0,\n\t\t\t\t\tpopularity: 0,\n\t\t\t\t\tcompletenessScore: 0,\n\t\t\t\t}\n\t\t\t}));',
		replace:
			'const transformedTags = includeStats\n\t\t\t? tags.map(toTagWithStats)\n\t\t\t: tags.map(tag => ({\n\t\t\t\t...tag,\n\t\t\t\tstats: {\n\t\t\t\t\ttotalRelations: 0,\n\t\t\t\t\tusageDiversity: 0,\n\t\t\t\t\tpopularity: 0,\n\t\t\t\t\tcompletenessScore: 0,\n\t\t\t\t}\n\t\t\t} as TagWithStats));',
	},
	{
		file: 'src/types/thumbnails.ts',
		search:
			"export interface LastProcessedThumbnail {\n\tid: string;\n\tpath: string;\n\tprocessedAt: Date;\n\tstatus: 'success' | 'error';\n\terror?: string;\n}",
		replace:
			"export interface LastProcessedThumbnail {\n\tid: string;\n\tpath: string;\n\tprocessedAt: Date;\n\tstatus: 'success' | 'error';\n\terror?: string;\n}",
	},
];

function applyFix(fix) {
	const filePath = path.join(projectRoot, fix.file);

	if (!fs.existsSync(filePath)) {
		console.log(`❌ Archivo no encontrado: ${fix.file}`);
		return false;
	}

	try {
		let content = fs.readFileSync(filePath, 'utf8');

		if (content.includes(fix.search)) {
			content = content.replace(fix.search, fix.replace);
			fs.writeFileSync(filePath, content, 'utf8');
			console.log(`✅ Corregido: ${fix.file}`);
			return true;
		}
		console.log(`⚠️ Patrón no encontrado en: ${fix.file}`);
		return false;
	} catch (error) {
		console.error(`❌ Error procesando ${fix.file}:`, error.message);
		return false;
	}
}

console.log('🔧 Iniciando corrección de errores TypeScript...\n');

let fixedCount = 0;
for (const fix of fixes) {
	if (applyFix(fix)) {
		fixedCount++;
	}
}

console.log(`\n✅ Corrección completada: ${fixedCount}/${fixes.length} archivos corregidos`);
