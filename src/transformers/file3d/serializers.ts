// Serializers para File3D
import { file3DSchema } from '@/types/entities/file3d/file3d.schema';
import type { File3D } from '@/types/entities/file3d/types';

export function validateFile3D(input: unknown): File3D {
	return file3DSchema.parse(input);
}
