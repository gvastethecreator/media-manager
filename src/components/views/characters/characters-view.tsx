import { useCallback, useState } from 'react';

import { useCharacters, useCreateCharacter } from '@/lib/api/characters';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCharacterStore } from '@/store/entities/character';
import type { ViewProps } from '../types';
import CharactersContentView from './characters-content-view';

const viewLogger = clientLogger.withContext('CharactersView');

export function CharactersView({}: ViewProps) {
	const { selectedCharacterId, selectCharacter } = useCharacterStore();
	const { mutate: createCharacter } = useCreateCharacter();

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
			clientEvents.emit('character:selected', { characterId });
		},
		[selectCharacter]
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
			isLoading={isLoading}
			error={error}
			localSearch={localSearch}
			showForm={showForm}
			newCharacterName={newCharacterName}
			newCharacterDescription={newCharacterDescription}
			selectedCharacterId={selectedCharacterId}
			setShowForm={setShowForm}
			setNewCharacterName={setNewCharacterName}
			setNewCharacterDescription={setNewCharacterDescription}
			handleCharacterSelect={handleCharacterSelect}
			handleCreateCharacter={handleCreateCharacter}
			handleRetry={handleRetry}
		/>
	);
}
