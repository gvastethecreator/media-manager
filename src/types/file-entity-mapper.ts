export const EntityType = {
	IMAGE: 'image',
	VIDEO: 'video',
	AUDIO: 'audio',
	JSON: 'jsonFile',
	FILE3D: 'file3d',
	DOCUMENT: 'document',
	UNKNOWN: 'unknown',
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export interface FileInfo {
	name: string;
	path: string;
	size: number;
	extension: string;
	hash?: string;
	lastModified: Date;
	folderId: string;
}

export interface EntityCreationResult {
	success: boolean;
	entityType: EntityType;
	entityId?: string;
	error?: string;
}

export interface EntityCreationStats {
	totalFiles: number;
	processed: number;
	successful: number;
	failed: number;
	errors: Array<{
		file: string;
		error: string;
	}>;
}

export const ENTITY_TYPE_MAPPING: Record<EntityType, string[]> = {
	[EntityType.IMAGE]: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.tif', '.svg', '.ico'],
	[EntityType.VIDEO]: ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.3gp'],
	[EntityType.AUDIO]: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff'],
	[EntityType.JSON]: ['.json'],
	[EntityType.FILE3D]: ['.obj', '.fbx', '.gltf', '.glb', '.dae', '.3ds', '.blend', '.stl', '.ply', '.x3d'],
	[EntityType.DOCUMENT]: ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt', '.pages', '.epub', '.mobi'],
	[EntityType.UNKNOWN]: [],
};
