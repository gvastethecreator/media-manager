'use server';

import { getPrismaClient } from '@/lib/db';
import { handlePrismaError } from '@/lib/errors';
import { fromPrismaJsonFile, fromPrismaJsonFiles } from '@/transformers/json-file/transformer';
import type { JsonFileFormData } from '@/types/entities/json-file/types';
import { revalidatePath } from 'next/cache';

// GET
export async function getJsonFiles() {
	try {
		const prisma = await getPrismaClient();
		const jsonFiles = await prisma.jsonFile.findMany({
			orderBy: { createdAt: 'desc' },
		});
		return fromPrismaJsonFiles(jsonFiles);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

export async function getJsonFileById(id: string) {
	try {
		const prisma = await getPrismaClient();
		const jsonFile = await prisma.jsonFile.findUnique({
			where: { id },
		});
		if (!jsonFile) {
			throw new Error('Archivo JSON no encontrado');
		}
		return fromPrismaJsonFile(jsonFile);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// CREATE
export async function createJsonFile(data: JsonFileFormData) {
	const {
		images,
		videos,
		audio,
		file3d,
		documents,
		albums,
		collections,
		tags,
		characters,
		places,
		worldItems,
		concepts,
		prompts,
		notes,
		wildcards,
		properties,
		groups,
		filePath,
		...jsonFileData
	} = data;

	try {
		const prisma = await getPrismaClient();
		const newJsonFile = await prisma.jsonFile.create({
			data: {
				...jsonFileData,
				filePath: filePath || '',
			},
		});
		revalidatePath('/json-file');
		return fromPrismaJsonFile(newJsonFile);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// UPDATE
export async function updateJsonFile(id: string, data: JsonFileFormData) {
	const {
		images,
		videos,
		audio,
		file3d,
		documents,
		albums,
		collections,
		tags,
		characters,
		places,
		worldItems,
		concepts,
		prompts,
		notes,
		wildcards,
		properties,
		groups,
		filePath,
		...jsonFileData
	} = data;

	try {
		const prisma = await getPrismaClient();
		const updatedJsonFile = await prisma.jsonFile.update({
			where: { id },
			data: {
				...jsonFileData,
				filePath: filePath !== undefined ? filePath : undefined,
			},
		});
		revalidatePath('/json-file');
		revalidatePath(`/json-file/${id}`);
		return fromPrismaJsonFile(updatedJsonFile);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// DELETE
export async function deleteJsonFile(id: string) {
	try {
		const prisma = await getPrismaClient();
		await prisma.jsonFile.delete({
			where: { id },
		});
		revalidatePath('/json-file');
		return { success: true };
	} catch (error) {
		throw handlePrismaError(error);
	}
}
