'use server';

import { getPrismaClient } from '@/lib/db';
import { handlePrismaError } from '@/lib/errors';
import { fromPrismaFile3D, fromPrismaFile3Ds } from '@/transformers/file3d/transformer';
import type { File3DFormData } from '@/types/entities/file-3d/types';
import { revalidatePath } from 'next/cache';

// GET
export async function getFile3Ds() {
	try {
		const prisma = await getPrismaClient();
		const file3ds = await prisma.file3D.findMany({
			orderBy: { createdAt: 'desc' },
		});
		return fromPrismaFile3Ds(file3ds);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

export async function getFile3DById(id: string) {
	try {
		const prisma = await getPrismaClient();
		const file3d = await prisma.file3D.findUnique({
			where: { id },
		});
		if (!file3d) {
			throw new Error('Archivo 3D no encontrado');
		}
		return fromPrismaFile3D(file3d);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// CREATE
export async function createFile3D(data: File3DFormData) {
	const {
		images,
		videos,
		audio,
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
		...file3dData
	} = data;

	try {
		const prisma = await getPrismaClient();
		const newFile3D = await prisma.file3D.create({
			data: {
				...file3dData,
				filePath: filePath || '',
			},
		});
		revalidatePath('/file3d');
		return fromPrismaFile3D(newFile3D);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// UPDATE
export async function updateFile3D(id: string, data: File3DFormData) {
	const {
		images,
		videos,
		audio,
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
		...file3dData
	} = data;

	try {
		const prisma = await getPrismaClient();
		const updatedFile3D = await prisma.file3D.update({
			where: { id },
			data: {
				...file3dData,
				filePath: filePath !== undefined ? filePath : undefined,
			},
		});
		revalidatePath('/file3d');
		revalidatePath(`/file3d/${id}`);
		return fromPrismaFile3D(updatedFile3D);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// DELETE
export async function deleteFile3D(id: string) {
	try {
		const prisma = await getPrismaClient();
		await prisma.file3D.delete({
			where: { id },
		});
		revalidatePath('/file3d');
		return { success: true };
	} catch (error) {
		throw handlePrismaError(error);
	}
}
