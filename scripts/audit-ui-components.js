#!/usr/bin/env bun

const fs = require('fs');
const path = require('path');

const UI_COMPONENTS_DIR = path.join(__dirname, '../src/components/ui');

console.log('🔍 AUDITORÍA COMPONENTES UI - Radix vs Base UI\n');

function analyzeComponent(filePath, fileName) {
	const content = fs.readFileSync(filePath, 'utf8');

	// Detectar imports
	const hasRadixImport = content.includes('radix-ui');
	const hasBaseUIImport = content.includes('@base-ui-components/react');

	// Detectar patrones específicos
	const hasRadixPatterns = content.includes('data-[state=') || content.includes('--radix-');
	const hasBaseUIPatterns =
		content.includes('data-[checked]') ||
		content.includes('data-[starting-style]') ||
		content.includes('--available-height');

	let status = '❓ UNKNOWN';
	const details = [];

	if (hasBaseUIImport) {
		status = '✅ BASE UI';
		if (hasBaseUIPatterns) {
			details.push('Patrones Base UI detectados');
		}
	} else if (hasRadixImport) {
		status = '⏳ RADIX UI';
		if (hasRadixPatterns) {
			details.push('Patrones Radix detectados');
		}
	} else {
		status = '🔧 CUSTOM';
		details.push('Sin dependencias UI externas');
	}

	return {
		file: fileName,
		status,
		details: details.join(', '),
		hasRadixImport,
		hasBaseUIImport,
		priority: hasRadixImport ? 'HIGH' : 'LOW',
	};
}

function main() {
	if (!fs.existsSync(UI_COMPONENTS_DIR)) {
		console.error('❌ Directorio de componentes UI no encontrado');
		return;
	}

	const files = fs
		.readdirSync(UI_COMPONENTS_DIR)
		.filter((file) => file.endsWith('.tsx'))
		.sort();

	const results = files.map((file) => {
		const filePath = path.join(UI_COMPONENTS_DIR, file);
		return analyzeComponent(filePath, file);
	});

	// Estadísticas
	const baseUICount = results.filter((r) => r.hasBaseUIImport).length;
	const radixCount = results.filter((r) => r.hasRadixImport).length;
	const customCount = results.filter((r) => !r.hasRadixImport && !r.hasBaseUIImport).length;

	console.log('📊 RESUMEN:');
	console.log(`✅ Base UI: ${baseUICount}/${files.length} (${Math.round((baseUICount / files.length) * 100)}%)`);
	console.log(`⏳ Radix UI: ${radixCount}/${files.length} (${Math.round((radixCount / files.length) * 100)}%)`);
	console.log(`🔧 Custom: ${customCount}/${files.length} (${Math.round((customCount / files.length) * 100)}%)`);
	console.log();

	// Componentes por categoría
	console.log('✅ COMPONENTES BASE UI:');
	for (const r of results.filter((r) => r.hasBaseUIImport)) {
		console.log(`  • ${r.file} - ${r.details}`);
	}
	console.log();

	console.log('⏳ COMPONENTES RADIX (PENDIENTES):');
	for (const r of results.filter((r) => r.hasRadixImport)) {
		console.log(`  • ${r.file} - ${r.details}`);
	}
	console.log();

	console.log('🔧 COMPONENTES CUSTOM:');
	for (const r of results.filter((r) => !r.hasRadixImport && !r.hasBaseUIImport)) {
		console.log(`  • ${r.file} - ${r.details}`);
	}
	console.log();

	// Prioridades de migración
	const highPriority = results.filter((r) => r.priority === 'HIGH');
	if (highPriority.length > 0) {
		console.log('🚨 ALTA PRIORIDAD PARA MIGRACIÓN:');
		for (const r of highPriority) {
			console.log(`  • ${r.file}`);
		}
	}
}

main();
