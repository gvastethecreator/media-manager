/**
 * Prueba simple del mapeo de entidades
 */

// ENTITY_TYPE_MAPPING usando la misma configuración del sistema
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

	return 'UNKNOWN';
}

// Lista de extensiones que debe soportar el sistema
const testExtensions = ['.wav', '.json', '.obj', '.md', '.txt'];

console.log('🔍 Probando mapeo de entidades directamente...\n');
console.log('📋 Extensiones a probar:', testExtensions);
console.log('─'.repeat(50));

for (const extension of testExtensions) {
	const entityType = getEntityTypeFromExtension(extension);
	console.log(`${extension.padEnd(6)} → ${entityType}`);
}

console.log('─'.repeat(50));
console.log('✅ Test completado');
