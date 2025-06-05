'use server';

/**
 * @file Exporta todas las acciones relacionadas con propiedades
 * @module app/actions/properties
 */

import * as PropertyActions from './property.actions';

// Re-exportar funciones individuales
export async function getProperties() {
	return PropertyActions.getProperties();
}

export async function getProperty(id: string) {
	return PropertyActions.getProperty(id);
}

export async function createProperty(data: any) {
	return PropertyActions.createProperty(data);
}

export async function updateProperty(id: string, data: any) {
	return PropertyActions.updateProperty(id, data);
}

export async function togglePropertyFavorite(id: string) {
	return PropertyActions.togglePropertyFavorite(id);
}

export async function deleteProperty(id: string) {
	return PropertyActions.deleteProperty(id);
}
