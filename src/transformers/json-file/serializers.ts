// Serializers para JsonFile
import { jsonFileSchema } from '@/types/entities/json-file/json-file.schema';
import type { JsonFile } from '@/types/entities/json-file';

export function validateJsonFile(input: unknown): JsonFile {
	return jsonFileSchema.parse(input);
}
