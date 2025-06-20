/**
 * @file Implementación del slice principal para Character
 * @module store/entities/character/slices/core
 * @description
 * 💀 **ESTE SLICE HA SIDO VACIADO INTENCIONADAMENTE.** 💀
 *
 * La gestión del estado de los personajes (y otras entidades del servidor) se ha migrado
 * a un enfoque más moderno y robusto utilizando React Query y Server Actions.
 *
 * Mantener una caché de cliente manual en un store de Zustand para datos del servidor
 * es un anti-patrón que conduce a:
 * - Duplicación de la lógica del servidor en el cliente.
 * - Problemas de sincronización y datos obsoletos (stale data).
 * - Complejidad innecesaria en el manejo del estado.
 *
 * El nuevo enfoque consiste en:
 * 1. Usar hooks de React Query (ej. `useCharacters`, `useCharacter`) para obtener datos.
 * 2. Usar `useMutation` de React Query para llamar a Server Actions que modifican los datos.
 * 3. Invalidar las queries de React Query tras una mutación para refrescar los datos automáticamente.
 *
 * Este archivo se mantiene temporalmente para evitar errores de importación en otros lugares,
 * pero su contenido ha sido eliminado y no debe ser utilizado.
 */

import type { StateCreator } from 'zustand';
import type { CharacterCoreSlice, CharacterState } from '../types';

/**
 * Crea el slice principal para Character.
 * 💀 **ESTA FUNCIÓN ESTÁ VACÍA INTENCIONADAMENTE.** 💀
 * @see La nota en la cabecera del archivo.
 */
export const createCharacterCoreSlice: StateCreator<CharacterState & CharacterCoreSlice, [], [], CharacterCoreSlice> = (
	_set,
	_get
) => ({
	// La lógica CRUD ha sido eliminada. Usar React Query y Server Actions en su lugar.
	addCharacter: () => {},
	updateCharacter: () => {},
	removeCharacter: () => {},
	bulkAddCharacters: () => {},
	bulkUpdateCharacters: () => {},
	bulkRemoveCharacters: () => {},
	toggleFavorite: () => {},
	setFeaturedImage: () => {},
	incrementLevel: () => {},
	decrementLevel: () => {},
	setLoading: () => {},
	setError: () => {},
	clearError: () => {},
	addRelationship: () => {},
	removeRelationship: () => {},
	getCharacterGroups: () => [],
	getCharacterProperties: () => [],
	getCharacterWildcards: () => [],
	addGroupToCharacter: () => {},
	removeGroupFromCharacter: () => {},
	addPropertyToCharacter: () => {},
	removePropertyFromCharacter: () => {},
	addWildcardToCharacter: () => {},
	removeWildcardFromCharacter: () => {},
	updateCharacterRelations: () => {},
	resetCharacters: () => {},
	resetState: () => {},
	addImagesToCharacter: () => {},
	removeImageFromCharacter: () => {},
});
