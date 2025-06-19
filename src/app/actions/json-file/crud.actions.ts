'use server';

// Server Actions para JsonFile
import { validateJsonFile } from '@/transformers/json-file/serializers';
import type { JsonFileComplete as JsonFile } from '@/types/entities/json-file';

export async function createJsonFile(input: unknown): Promise<JsonFile> {
	const json = validateJsonFile(input);
	// TODO: Persistir en DB
	return json;
}

export async function getJsonFileById(_id: string): Promise<JsonFile | null> {
	// TODO: Obtener de DB
	return null;
}

export async function updateJsonFile(_id: string, input: unknown): Promise<JsonFile> {
	const json = validateJsonFile(input);
	// TODO: Actualizar en DB
	return json;
}

export async function deleteJsonFile(_id: string): Promise<boolean> {
	// TODO: Eliminar de DB
	return true;
}
