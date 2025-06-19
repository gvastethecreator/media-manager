// Serializers para JsonFile
import type { JsonFileComplete } from '@/types/entities/json-file';
import { jsonFileSchema } from '@/types/entities/json-file/json-file.schema';

export function validateJsonFile(input: unknown): JsonFileComplete {
	return jsonFileSchema.parse(input);
}

export function serializeJsonFile(json: JsonFileComplete): string {
	return JSON.stringify({
		id: json.id,
		name: json.name,
		filePath: json.filePath,
		content: json.content,
		createdAt: json.createdAt.toISOString(),
		updatedAt: json.updatedAt.toISOString(),
	});
}
