// Test simple para validar ENTITY_TYPE_MAPPING
import { EntityType } from './src/types/file-entity-mapper.ts';

// ENTITY_TYPE_MAPPING copy
const ENTITY_TYPE_MAPPING = {
	[EntityType.IMAGE]: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.tif', '.svg', '.ico'],
	[EntityType.VIDEO]: ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.3gp'],
	[EntityType.AUDIO]: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff'],
	[EntityType.DOCUMENT]: ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt', '.pages', '.epub', '.mobi'],
	[EntityType.JSON]: ['.json'],
	[EntityType.FILE3D]: ['.obj', '.fbx', '.gltf', '.glb', '.dae', '.3ds', '.blend', '.stl', '.ply', '.x3d'],
	[EntityType.WORKFLOW]: ['.workflow', '.json']
};

function getEntityTypeFromExtension(extension) {
	const lowerExt = extension.toLowerCase();
	
	for (const [entityType, extensions] of Object.entries(ENTITY_TYPE_MAPPING)) {
		if (extensions.includes(lowerExt)) {
			return entityType;
		}
	}
	
	return EntityType.UNKNOWN;
}

// Test extensions
const testExtensions = ['.wav', '.json', '.obj', '.md', '.txt'];

console.log('🧪 Testing ENTITY_TYPE_MAPPING:');
for (const ext of testExtensions) {
	const result = getEntityTypeFromExtension(ext);
	console.log(`  ${ext} -> ${result}`);
}