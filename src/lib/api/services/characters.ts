import type { CharacterWithStats } from '@/types/entities/character/types';
import { apiClient } from '../client';

export interface CharacterCardData extends CharacterWithStats {}

export interface GetCharactersOptions {
	limit?: number;
	offset?: number;
	searchTerm?: string;
	category?: string;
	orderBy?: 'name' | 'createdAt' | 'updatedAt' | 'relationCount';
	orderDir?: 'asc' | 'desc';
	includeStats?: boolean;
}

/**
 * Obtiene los datos de un personaje para mostrar en una tarjeta
 */
export async function getCharacterCardData(characterId: string): Promise<CharacterCardData> {
	return apiClient.get<CharacterCardData>(`/characters/${characterId}/card-data`);
}

/**
 * Obtiene una lista de personajes para mostrar en una galería de tarjetas
 */
export async function getCharactersForCards(options: GetCharactersOptions = {}): Promise<CharacterCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<CharacterCardData[]>(`/characters/cards?${params.toString()}`);
}

/**
 * Busca personajes con filtros avanzados
 */
export async function searchCharacters(
	options: GetCharactersOptions & { searchTerm: string }
): Promise<CharacterCardData[]> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	return apiClient.get<CharacterCardData[]>(`/characters/search?${params.toString()}`);
}
