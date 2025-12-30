import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCharacters, useCreateCharacter } from '@/lib/api/characters';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCharacterStore } from '@/store/entities/character';
import type { ViewProps } from '../types';
import CharactersContentView from './characters-content-view';

const viewLogger = clientLogger.withContext('CharactersView');

export function CharactersView(_props: ViewProps) {
	const navigate = useNavigate();
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
		limit: 100,
		sortBy: 'updatedAt',
		sortOrder: 'desc',
	});

	const characters = charactersResponse?.data || [];

	const handleCharacterSelect = useCallback(
		(characterId: string) => {
			viewLogger.info('🎭 Seleccionando character y navegando', { characterId });
			selectCharacter(characterId);
			clientEvents.emit('character:selected', { characterId });
			navigate(`/characters/${characterId}`);
		},
		[selectCharacter, navigate]
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
