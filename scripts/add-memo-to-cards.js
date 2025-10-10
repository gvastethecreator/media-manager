#!/usr/bin/env node
/**
 * Script para agregar React.memo a componentes Card
 * Ejecutar: bun run scripts/add-memo-to-cards.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';

// Patrones de archivos a procesar
const CARD_PATTERNS = ['src/components/cards/**/*-card.tsx', 'src/components/entities/**/*-card.tsx'];

// Cards a procesar (los más usados)
const PRIORITY_CARDS = [
	'video-card.tsx',
	'audio-card.tsx',
	'folder-card.tsx',
	'collection-card.tsx',
	'group-card.tsx',
	'album-card.tsx',
	'prompt-card.tsx',
	'note-card.tsx',
	'property-card.tsx',
	'wildcard-card.tsx',
	'file3d-card.tsx',
	'document-card.tsx',
	'json-file-card.tsx',
	'place-card.tsx',
	'world-item-card.tsx',
	'concept-card.tsx',
	'character-card.tsx',
];

async function processCardFile(filePath) {
	const content = await fs.readFile(filePath, 'utf-8');

	// Verificar si ya tiene memo
	if (content.includes('= memo(') || content.includes('export const')) {
		return { skipped: true, reason: 'Ya tiene memo o es const' };
	}

	// Buscar el export function
	const exportMatch = content.match(/export function (\w+)\s*\(/);
	if (!exportMatch) {
		return { skipped: true, reason: 'No tiene export function' };
	}

	const componentName = exportMatch[0];

	// 1. Agregar memo a imports
	let newContent = content;
	if (!newContent.includes('import { memo')) {
		newContent = newContent.replace(/from 'react';/, (match) => {
			const hasImports = content.match(/import { ([^}]+) } from 'react';/);
			if (hasImports) {
				const imports = hasImports[1];
				if (!imports.includes('memo')) {
					return `import { memo, ${imports.trim()} } from 'react';`;
				}
			}
			return "import { memo } from 'react';" + '\n' + match;
		});
	}

	// 2. Convertir export function a memo
	newContent = newContent.replace(/export function (\w+)\(/, 'export const $1 = memo(function $1(');

	// 3. Cerrar el memo al final de la función
	// Buscar el último } del componente
	const lines = newContent.split('\n');
	let braceCount = 0;
	let startFound = false;
	let endLineIndex = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.includes(`export const ${exportMatch[1]}`)) {
			startFound = true;
		}
		if (startFound) {
			for (const char of line) {
				if (char === '{') braceCount++;
				if (char === '}') braceCount--;
			}
			if (braceCount === 0 && line.trim() === '}') {
				endLineIndex = i;
				break;
			}
		}
	}

	if (endLineIndex !== -1) {
		lines[endLineIndex] = lines[endLineIndex].replace('}', '});');
		newContent = lines.join('\n');
	}

	// 4. Agregar comentario
	newContent = newContent.replace(
		`export const ${exportMatch[1]} = memo`,
		`// ✅ OPTIMIZADO: Memoizado para evitar re-renders innecesarios\nexport const ${exportMatch[1]} = memo`
	);

	await fs.writeFile(filePath, newContent, 'utf-8');

	return { success: true };
}

async function main() {
	console.log('🎨 Agregando React.memo a componentes Card...\n');

	// Buscar todos los archivos card
	const allFiles = await glob(CARD_PATTERNS);

	// Filtrar solo priority cards
	const filesToProcess = allFiles.filter((file) => PRIORITY_CARDS.some((card) => file.endsWith(card)));

	console.log(`📁 Encontrados ${filesToProcess.length} cards prioritarios\n`);

	let processed = 0;
	let skipped = 0;
	let errors = 0;

	for (const file of filesToProcess) {
		const fileName = path.basename(file);
		try {
			const result = await processCardFile(file);

			if (result.skipped) {
				console.log(`⚠️  ${fileName} - ${result.reason}`);
				skipped++;
			} else {
				console.log(`✅ ${fileName} - Memoizado`);
				processed++;
			}
		} catch (error) {
			console.log(`❌ ${fileName} - Error: ${error.message}`);
			errors++;
		}
	}

	console.log('\n📊 Resumen:');
	console.log(`   ✅ Procesados: ${processed}`);
	console.log(`   ⚠️  Omitidos: ${skipped}`);
	console.log(`   ❌ Errores: ${errors}`);
	console.log(`\n💡 Ejecuta "bun run tsc" para verificar errores`);
}

main().catch(console.error);
