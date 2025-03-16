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

// Función para migrar un archivo
function migrateFile(filePath) {
	console.log(`Analizando: ${filePath}`);
	let content;

	try {
		content = fs.readFileSync(filePath, 'utf8');
	} catch (error) {
		console.error(`Error al leer archivo ${filePath}: ${error.message}`);
		return false;
	}

	let modified = false;
	let originalContent = content;

	// Reemplazar importaciones de logger
	if (
		content.includes('import { logger }') &&
		(content.includes("from '@/lib/logger/logger'") ||
			content.includes("from './logger/logger'") ||
			content.includes("from '../lib/logger/logger'"))
	) {
		content = content.replace(
			/import\s*{\s*logger\s*}\s*from\s*['"]([@./].*?)\/logger\/logger['"]/g,
			"import { serverLogger } from '$1/logger/server-logger'"
		);
		modified = true;
	}

	// Reemplazar createServiceLogger por createServerServiceLogger
	if (content.includes('createServiceLogger')) {
		content = content.replace(
			/import\s*{\s*createServiceLogger(?:\s+as\s+\w+)?\s*}\s*from\s*['"]([@./].*?)\/logger\/logger['"]/g,
			"import { createServerServiceLogger } from '$1/logger/server-logger'"
		);
		content = content.replace(/createServiceLogger/g, 'createServerServiceLogger');
		modified = true;
	}

	// Reemplazar referencias a logger por serverLogger
	if (modified) {
		// Solo reemplazar cuando logger es usado como objeto, no como parte de otro identificador
		content = content.replace(/\blogger\./g, 'serverLogger.');
	}

	// Guardar cambios si se modificó el archivo
	if (modified && content !== originalContent) {
		try {
			fs.writeFileSync(filePath, content, 'utf8');
			console.log(`✅ Migrado: ${filePath}`);
			return true;
		} catch (error) {
			console.error(`Error al escribir archivo ${filePath}: ${error.message}`);
			return false;
		}
	}

	return false;
}

// Directorio principal
const rootDir = path.resolve(__dirname, '..');
console.log(`Buscando archivos en: ${rootDir}`);

// Buscar archivos TypeScript y JavaScript
const tsFiles = findFiles(path.join(rootDir, 'src'), /\.(ts|tsx|js|jsx)$/);
console.log(`Encontrados ${tsFiles.length} archivos para analizar`);

// Migrar cada archivo
let migratedCount = 0;
let migratedFiles = [];

for (const file of tsFiles) {
	if (migrateFile(file)) {
		migratedCount++;
		migratedFiles.push(file);
	}
}

console.log(`\n✅ Migración completada. ${migratedCount} archivos actualizados.`);

if (migratedCount > 0) {
	console.log('\nArchivos migrados:');
	migratedFiles.forEach((file) => {
		console.log(`- ${file.replace(rootDir, '')}`);
	});
}

// Verificar si quedan referencias al logger antiguo
console.log('\nVerificando referencias restantes...');
let remainingReferences = 0;

for (const file of tsFiles) {
	try {
		const content = fs.readFileSync(file, 'utf8');
		if (
			content.includes("from '@/lib/logger/logger'") ||
			content.includes("from './logger/logger'") ||
			content.includes("from '../lib/logger/logger'")
		) {
			console.log(`⚠️ Referencia restante en: ${file.replace(rootDir, '')}`);
			remainingReferences++;
		}
	} catch (error) {
		console.error(`Error al verificar archivo ${file}: ${error.message}`);
	}
}

if (remainingReferences === 0) {
	console.log('✅ No se encontraron referencias restantes al logger antiguo.');
} else {
	console.log(`⚠️ Se encontraron ${remainingReferences} archivos con referencias al logger antiguo.`);
}
