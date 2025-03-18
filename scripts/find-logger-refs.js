const fs = require('fs');
const path = require('path');

// Función para buscar archivos recursivamente
function findFiles(dir, pattern) {
	let results = [];
	try {
		const files = fs.readdirSync(dir);

		for (const file of files) {
			const filePath = path.join(dir, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
				results = results.concat(findFiles(filePath, pattern));
			} else if (pattern.test(file)) {
				results.push(filePath);
			}
		}
	} catch (error) {
		console.error(`Error al leer directorio ${dir}: ${error.message}`);
	}

	return results;
}

// Directorio principal
const rootDir = path.resolve(__dirname, '..');
console.log(`Buscando archivos en: ${rootDir}`);

// Buscar archivos TypeScript y JavaScript
const tsFiles = findFiles(path.join(rootDir, 'src'), /\.(ts|tsx|js|jsx)$/);
console.log(`Encontrados ${tsFiles.length} archivos para analizar`);

// Buscar referencias al logger antiguo
let referencesCount = 0;
const filesWithReferences = [];

for (const file of tsFiles) {
	try {
		const content = fs.readFileSync(file, 'utf8');
		if (
			content.includes("from '@/lib/logger/logger'") ||
			content.includes("from './logger/logger'") ||
			content.includes("from '../lib/logger/logger'")
		) {
			console.log(`Referencia encontrada en: ${file.replace(rootDir, '')}`);
			filesWithReferences.push(file);
			referencesCount++;
		}
	} catch (error) {
		console.error(`Error al leer archivo ${file}: ${error.message}`);
	}
}

console.log(`\nSe encontraron ${referencesCount} archivos con referencias al logger antiguo.`);

if (referencesCount > 0) {
	console.log('\nArchivos con referencias:');
	filesWithReferences.forEach((file) => {
		console.log(`- ${file.replace(rootDir, '')}`);
	});
}
