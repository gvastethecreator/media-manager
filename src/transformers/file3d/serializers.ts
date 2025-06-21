// Serializers para File3D

import type { File3D } from '@/types/entities/file3d';
import { file3DSchema } from '@/types/entities/file3d/file3d.schema';

export function validateFile3D(input: unknown): File3D {
	return file3DSchema.parse(input) as File3D;
}
