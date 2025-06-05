'use server';

/**
 * @file Exporta todas las acciones relacionadas con conceptos
 * @module app/actions/concepts
 */

/**
 * Módulo de acciones para la entidad Concept
 * Exporta todas las acciones relacionadas con conceptos y sus relaciones
 */

// Importar acciones básicas de conceptos (CRUD)
import * as ConceptActions from './concept.actions';

// Importar acción de eliminación de conceptos
import { deleteConcept as deleteConceptAction } from './concept-delete.actions';

// Importar acciones para la gestión de imágenes relacionadas
import {
	addConceptImage as addConceptImageAction,
	getConceptImages as getConceptImagesAction,
	removeConceptImage as removeConceptImageAction,
} from './concept-images.actions';

// Re-exportar funciones individuales - Acciones básicas
export async function getConcepts() {
	return ConceptActions.getConcepts();
}

export async function getConcept(id: string) {
	return ConceptActions.getConcept(id);
}

export async function getConceptWithRelations(id: string) {
	return ConceptActions.getConceptWithRelations(id);
}

export async function createConcept(data: any) {
	return ConceptActions.createConcept(data);
}

export async function updateConcept(id: string, data: any) {
	return ConceptActions.updateConcept(id, data);
}

export async function linkEntityToConcept(conceptId: string, entityId: string, entityType: string) {
	return ConceptActions.linkEntityToConcept(conceptId, entityId, entityType);
}

export async function unlinkEntityFromConcept(conceptId: string, entityId: string, entityType: string) {
	return ConceptActions.unlinkEntityFromConcept(conceptId, entityId, entityType);
}

// Re-exportar funciones individuales - Acciones de eliminación
export async function deleteConcept(id: string) {
	return deleteConceptAction(id);
}

// Re-exportar funciones individuales - Acciones de imágenes
export async function addConceptImage(conceptId: string, imageId: string) {
	return addConceptImageAction(conceptId, imageId);
}

export async function getConceptImages(conceptId: string) {
	return getConceptImagesAction(conceptId);
}

export async function removeConceptImage(conceptId: string, imageId: string) {
	return removeConceptImageAction(conceptId, imageId);
}

// Exportar interfaces
export type { ConceptWithImages } from './concept.actions';
