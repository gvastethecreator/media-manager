// Serializers para Document
import { documentSchema } from '@/types/entities/document/document.schema';
import type { Document } from '@/types/entities/document';

export function validateDocument(input: unknown): Document {
	return documentSchema.parse(input);
}
