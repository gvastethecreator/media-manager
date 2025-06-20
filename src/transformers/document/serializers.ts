// Serializers para Document
import type { Document, DocumentComplete } from '@/types/entities/document';
import { documentSchema } from '@/types/entities/document/document.schema';

export function validateDocument(input: unknown): DocumentComplete {
	const document = documentSchema.parse(input) as Document;
	// Agregar _count vacío para convertir a DocumentComplete
	return {
		...document,
		_count: {}
	};
}
