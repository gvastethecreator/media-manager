import fs from 'fs';
import { glob } from 'glob';

// Script para corregir patrones `return res.status` por `res.status; return;`
async function fixReturnResStatus() {
	const routesDir = 'src/server/routes';
	const files = await glob(`${routesDir}/**/*.ts`);

	let totalFiles = 0;
	let totalReplacements = 0;

	for (const filePath of files) {
		try {
			const content = fs.readFileSync(filePath, 'utf8');

			// Patrón más específico que busca líneas completas con return res.status
			const lines = content.split('\n');
			let modified = false;

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const match = line.match(/^(\s*)return (res\.status\([^)]+\)\.(?:json|send)\([^;]*\));?(.*)$/);

				if (match) {
					const [, indent, resCall, rest] = match;
					// Reemplazar por dos líneas separadas
					lines[i] = `${indent}${resCall};`;
					lines.splice(i + 1, 0, `${indent}return;${rest}`);
					modified = true;
					totalReplacements++;
				}
			}

			if (modified) {
				const newContent = lines.join('\n');
				fs.writeFileSync(filePath, newContent);
				console.log(`✅ Fixed patterns in ${filePath}`);
				totalFiles++;
			}
		} catch (error) {
			console.error(`❌ Error processing ${filePath}:`, error.message);
		}
	}

	console.log('\n📊 Summary:');
	console.log(`   Files processed: ${totalFiles}`);
	console.log(`   Total replacements: ${totalReplacements}`);
}

fixReturnResStatus().catch(console.error);
