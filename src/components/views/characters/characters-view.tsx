import { useCallback, useState } from 'react';

import { useEntitySelection } from '@/hooks/use-entity-selection';
import { useCharacters, useCreateCharacter } from '@/lib/api/characters';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCharacterStore } from '@/store/entities/character';
import type { ViewProps } from '../types';
import CharactersContentView from './characters-content-view';

const viewLogger = clientLogger.withContext('CharactersView');

export function CharactersView(_props: ViewProps) {
	const { selectedCharacterId, selectCharacter } = useCharacterStore();
	const { mutate: createCharacter } = useCreateCharacter();
	const { handleItemClick: updateSelection } = useEntitySelection();

	const [localSearch, setLocalSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [newCharacterName, setNewCharacterName] = useState('');
	const [newCharacterDescription, setNewCharacterDescription] = useState('');

	// Usar React Query hook en lugar de server action
	const {
		data: charactersResponse,
		isLoading,
		error,
		refetch,
	} = useCharacters({
		search: localSearch,
		sortBy: 'name',
		sortOrder: 'asc',
	});

	const characters = charactersResponse?.data || [];

	const handleCharacterSelect = useCallback(
		(characterId: string) => {
			viewLogger.info('🎭 Seleccionando character', { characterId });
			selectCharacter(characterId);

			// Actualizar panel de detalles con el personaje seleccionado
			const character = characters.find((c) => c.id === characterId);
			if (character) {
				updateSelection(character as any);
			}

			clientEvents.emit('character:selected', { characterId });
		},
		[selectCharacter, characters, updateSelection]
	);

	const handleCreateCharacter = useCallback(() => {
		if (newCharacterName.trim() === '') {
			// toast({
			// 	title: '❌ Error',
			// 	description: 'El nombre del personaje no puede estar vacío.',
			// 	variant: 'destructive',
			// });
			return;
		}
		createCharacter({ name: newCharacterName, description: newCharacterDescription });
		setNewCharacterName('');
		setNewCharacterDescription('');
		setShowForm(false);
	}, [newCharacterName, newCharacterDescription, createCharacter]);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar characters');
		refetch();
	}, [refetch]);

	return (
		<CharactersContentView
			characters={characters}
			error={error}
			handleCharacterSelect={handleCharacterSelect}
			handleCreateCharacter={handleCreateCharacter}
			handleRetry={handleRetry}
			isLoading={isLoading}
			localSearch={localSearch}
			newCharacterDescription={newCharacterDescription}
			newCharacterName={newCharacterName}
			selectedCharacterId={selectedCharacterId}
			setNewCharacterDescription={setNewCharacterDescription}
			setNewCharacterName={setNewCharacterName}
			setShowForm={setShowForm}
			showForm={showForm}
		/>
	);
}
