// Serializers para File3D

import type { File3D } from '@/types/entities/file3d';
import { file3dSchema } from '@/types/entities/file3d/file3d.schema';

export function validateFile3D(input: unknown): File3D {
	return file3dSchema.parse(input);
}
