/**
 * @file File Services Errors implementado con Effect
 * @module services/file/file-services-errors.effect
 * @description Errores para File3D, Document, JsonFile, UploadedImages
 * @created 2025-10-11 - Fase 10 Effect Implementation
 */

import { Data } from 'effect';

// ============= File3D Errors =============

export class File3DNotFound extends Data.TaggedError('File3DNotFound')<{
	readonly fileId: string;
}> {
	readonly displayMessage = `File3D not found: ${this.fileId}`;
}

export class File3DValidationError extends Data.TaggedError('File3DValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `File3D validation failed: ${this.message}`;
}

export class File3DDatabaseError extends Data.TaggedError('File3DDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export const fromUnknownFile3DError = (operation: string, error: unknown): File3DError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) return new File3DNotFound({ fileId: 'unknown' });
		return new File3DDatabaseError({ operation, message: error.message });
	}
	return new File3DDatabaseError({ operation, message: String(error) });
};

export type File3DError = File3DNotFound | File3DValidationError | File3DDatabaseError;

// ============= Document Errors =============

export class DocumentNotFound extends Data.TaggedError('DocumentNotFound')<{
	readonly documentId: string;
}> {
	readonly displayMessage = `Document not found: ${this.documentId}`;
}

export class DocumentValidationError extends Data.TaggedError('DocumentValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `Document validation failed: ${this.message}`;
}

export class DocumentDatabaseError extends Data.TaggedError('DocumentDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export const fromUnknownDocumentError = (operation: string, error: unknown): DocumentError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) return new DocumentNotFound({ documentId: 'unknown' });
		return new DocumentDatabaseError({ operation, message: error.message });
	}
	return new DocumentDatabaseError({ operation, message: String(error) });
};

export type DocumentError = DocumentNotFound | DocumentValidationError | DocumentDatabaseError;

// ============= JsonFile Errors =============

export class JsonFileNotFound extends Data.TaggedError('JsonFileNotFound')<{
	readonly fileId: string;
}> {
	readonly displayMessage = `JsonFile not found: ${this.fileId}`;
}

export class JsonFileValidationError extends Data.TaggedError('JsonFileValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `JsonFile validation failed: ${this.message}`;
}

export class JsonFileDatabaseError extends Data.TaggedError('JsonFileDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export const fromUnknownJsonFileError = (operation: string, error: unknown): JsonFileError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) return new JsonFileNotFound({ fileId: 'unknown' });
		return new JsonFileDatabaseError({ operation, message: error.message });
	}
	return new JsonFileDatabaseError({ operation, message: String(error) });
};

export type JsonFileError = JsonFileNotFound | JsonFileValidationError | JsonFileDatabaseError;

// ============= UploadedImages Errors =============

export class UploadedImagesErrorNotFound extends Data.TaggedError('UploadedImagesErrorNotFound')<{
	readonly imageId: string;
}> {
	readonly displayMessage = `UploadedImage not found: ${this.imageId}`;
}

export class UploadedImagesErrorValidationError extends Data.TaggedError('UploadedImagesErrorValidationError')<{
	readonly field: string;
	readonly message: string;
}> {
	readonly displayMessage = `UploadedImage validation failed: ${this.message}`;
}

export class UploadedImagesErrorDatabaseError extends Data.TaggedError('UploadedImagesErrorDatabaseError')<{
	readonly operation: string;
	readonly message: string;
}> {
	readonly displayMessage = `Database error: ${this.message}`;
}

export const fromUnknownUploadedImagesError = (operation: string, error: unknown): UploadedImagesError => {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('not found')) return new UploadedImagesErrorNotFound({ imageId: 'unknown' });
		return new UploadedImagesErrorDatabaseError({ operation, message: error.message });
	}
	return new UploadedImagesErrorDatabaseError({ operation, message: String(error) });
};

export type UploadedImagesError =
	| UploadedImagesErrorNotFound
	| UploadedImagesErrorValidationError
	| UploadedImagesErrorDatabaseError;
