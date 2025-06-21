'use server';

import { prisma } from '@/lib/prisma';
import {
    conceptPayload,
    fromPrismaConcept,
    mapConceptSearchOptionsToPrisma,
    mapCreateConceptDataToPrisma,
    mapUpdateConceptDataToPrisma,
} from '@/transformers/concept';
import type {
    ConceptComplete,
    ConceptCreateInput,
    ConceptSearchOptions,
    ConceptUpdateInput,
} from '@/types/entities/concept/types';
import { revalidatePath } from 'next/cache';

const REVALIDATE_PATHS = ['/settings/concepts', '/library/concepts'];

async function revalidateConceptPaths(id?: string) {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path, 'page');
	}
	if (id) {
		revalidatePath(`/library/concepts/${id}`, 'page');
	}
}

export async function getConcepts(options: ConceptSearchOptions): Promise<ConceptComplete[]> {
	try {
		const findOptions = mapConceptSearchOptionsToPrisma(options);
		const concepts = await prisma.concept.findMany({
			...findOptions,
			...conceptPayload,
		});
		const transformedConcepts = concepts
			.map(fromPrismaConcept)
			.filter((c: ConceptComplete | null): c is ConceptComplete => c !== null);
		return transformedConcepts;
	} catch (error) {
		console.error('Error al obtener los conceptos:', error);
		throw new Error('No se pudieron obtener los conceptos.');
	}
}

export async function getConceptById(id: string): Promise<ConceptComplete | null> {
	try {
		const concept = await prisma.concept.findUnique({
			where: { id },
			...conceptPayload,
		});
		return fromPrismaConcept(concept);
	} catch (error) {
		console.error(`Error al obtener el concepto con ID ${id}:`, error);
		throw new Error('No se pudo obtener el concepto.');
	}
}

export async function createConcept(input: ConceptCreateInput): Promise<ConceptComplete> {
	try {
		const data = mapCreateConceptDataToPrisma(input);
		const newConcept = await prisma.concept.create({
			data,
			...conceptPayload,
		});
		await revalidateConceptPaths();
		const transformedConcept = fromPrismaConcept(newConcept);
		if (!transformedConcept) {
			throw new Error('Error al transformar el concepto creado.');
		}
		return transformedConcept;
	} catch (error) {
		console.error('Error al crear el concepto:', error);
		throw new Error('No se pudo crear el concepto.');
	}
}

export async function updateConcept(id: string, input: ConceptUpdateInput): Promise<ConceptComplete> {
	try {
		const data = mapUpdateConceptDataToPrisma(input);
		const updatedConcept = await prisma.concept.update({
			where: { id },
			data,
			...conceptPayload,
		});
		await revalidateConceptPaths(id);
		const transformedConcept = fromPrismaConcept(updatedConcept);
		if (!transformedConcept) {
			throw new Error('Error al transformar el concepto actualizado.');
		}
		return transformedConcept;
	} catch (error) {
		console.error(`Error al actualizar el concepto con ID ${id}:`, error);
		throw new Error('No se pudo actualizar el concepto.');
	}
}

export async function deleteConcept(id: string): Promise<boolean> {
	try {
		await prisma.concept.delete({ where: { id } });
		await revalidateConceptPaths();
		return true;
	} catch (error) {
		console.error(`Error al eliminar el concepto con ID ${id}:`, error);
		return false;
	}
}
