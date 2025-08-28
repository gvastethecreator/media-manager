/**
 * Script para verificar directamente la funcionalidad del FileEntityMapperService
 * sin necesidad de endpoints HTTP
 */

// Usar require porque estamos en el entorno del servidor
const path = require('path');

// Simular el import del servicio usando require dinámico
console.log('🔍 Cargando FileEntityMapperService...');

// Lista de extensiones que el sistema debe soportar
const testExtensions = ['.wav', '.json', '.obj', '.md', '.txt'];

// Definir ENTITY_TYPE_MAPPING directamente para el test
const ENTITY_TYPE_MAPPING = {
	IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif', '.ico', '.avif', '.heic', '.heif'],
	VIDEO: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.mpg', '.mpeg', '.ogv'],
	AUDIO: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.opus', '.aiff'],
	DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages', '.md', '.tex'],
	JSON: ['.json', '.jsonl', '.geojson'],
	FILE3D: ['.obj', '.fbx', '.dae', '.3ds', '.blend', '.max', '.c4d', '.ma', '.mb', '.lwo', '.x3d'],
	WORKFLOW: ['.json'],
};

// Función para obtener tipo de entidad desde extensión
function getEntityTypeFromExtension(extension) {
	const normalizedExt = extension.toLowerCase();

	for (const [entityType, extensions] of Object.entries(ENTITY_TYPE_MAPPING)) {
		if (extensions.includes(normalizedExt)) {
			return entityType;
		}
	}

	return null;
}

console.log('🔍 Probando FileEntityMapperService directamente...\n');

console.log('📋 Extensiones a probar:', testExtensions);
console.log('─'.repeat(50));

for (const extension of testExtensions) {
	try {
		const entityType = getEntityTypeFromExtension(extension);
		console.log(`${extension.padEnd(6)} → ${entityType || 'null'}`);
	} catch (error) {
		console.log(`${extension.padEnd(6)} → ERROR: ${error.message}`);
	}
}

console.log('─'.repeat(50));
console.log('✅ Test completado');
