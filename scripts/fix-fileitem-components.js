/**
 * Script para migrar componentes de FileItem a EntityWithStats
 * Ejecutar con: node scripts/fix-fileitem-components.js
 */

import fs from 'fs';
import path from 'path';

const componentsToFix = [
	'src/components/views/world-items/world-item-content-view.tsx',
	'src/components/views/tags/tag-content-view.tsx',
	'src/components/views/notes/note-content-view.tsx',
	'src/components/views/places/place-content-view.tsx',
	'src/components/views/concepts/concept-content-view.tsx',
	'src/components/views/collections/collection-content-view.tsx',
	'src/components/views/characters/character-content-view.tsx',
	'src/components/views/albums/album-content-view.tsx',
];

function fixComponent(filePath) {
	try {
		console.log(`🔧 Corrigiendo: ${filePath}`);

		let content = fs.readFileSync(filePath, 'utf8');
		let hasChanges = false;

		// 1. Reemplazar import de FileItem
		if (content.includes("import type { FileItem } from '@/types/files';")) {
			content = content.replace(
				"import type { FileItem } from '@/types/files';",
				"import type { EntityWithStats } from '@/types/common/entity-with-stats';"
			);
			hasChanges = true;
			console.log('  ✅ Import actualizado');
		}

		// 2. Reemplazar useState<FileItem[]>
		if (content.includes('useState<FileItem[]>')) {
			content = content.replace(/useState<FileItem\[\]>/g, 'useState<EntityWithStats[]>');
			hasChanges = true;
			console.log('  ✅ useState actualizado');
		}

		// 3. Reemplazar conversiones forzadas
		if (content.includes('as unknown as FileItem[]')) {
			content = content.replace(/as unknown as FileItem\[\]/g, 'as EntityWithStats[]');
			hasChanges = true;
			console.log('  ✅ Conversiones actualizadas');
		}

		// 4. Reemplazar tipos en callbacks
		if (content.includes('(item: FileItem)')) {
			content = content.replace(/\(item: FileItem\)/g, '(item: EntityWithStats)');
			hasChanges = true;
			console.log('  ✅ Callbacks actualizados');
		}

		// 5. Reemplazar useEvents<FileItem[]>
		if (content.includes('useEvents<FileItem[]>')) {
			content = content.replace(/useEvents<FileItem\[\]>/g, 'useEvents<EntityWithStats[]>');
			hasChanges = true;
			console.log('  ✅ useEvents actualizado');
		}

		if (hasChanges) {
			fs.writeFileSync(filePath, content, 'utf8');
			console.log(`✅ ${filePath} corregido exitosamente`);
		} else {
			console.log(`ℹ️  ${filePath} ya estaba correcto`);
		}
	} catch (error) {
		console.error(`❌ Error corrigiendo ${filePath}:`, error.message);
	}
}

console.log('🚀 Iniciando migración de FileItem a EntityWithStats...\n');

for (const component of componentsToFix) {
	if (fs.existsSync(component)) {
		fixComponent(component);
	} else {
		console.log(`⚠️  Archivo no encontrado: ${component}`);
	}
	console.log('');
}

console.log('✅ Migración completada');
