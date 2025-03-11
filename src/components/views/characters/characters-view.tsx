'use client';

import type { CharacterWithStats } from '@/app/actions/characters/character.actions';
import { getCharacters } from '@/app/actions/characters/character.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { CharacterCard } from '@/components/features/entity-cards/character/character-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import { Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('CharactersView');

export function CharactersView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentCharacter } = useFileManager();
	const [characters, setCharacters] = useState<CharacterWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticCharacters, _addEvent] = clientEvents.useEvents<CharacterWithStats[]>(characters);

	const fetchCharacters = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando personajes...');
			const data = await getCharacters();
			setCharacters(data);
			viewLogger.info(`✅ ${data.length} personajes cargados`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando personajes:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar personajes inicialmente
		fetchCharacters();
	}, [fetchCharacters]);

	const handleCharacterClick = useCallback(
		(character: CharacterWithStats) => {
			viewLogger.info('🖱️ Click en personaje:', character.name);
			setCurrentView('character-content');
			setCurrentCharacter(character.id);
		},
		[setCurrentView, setCurrentCharacter]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!optimisticCharacters || optimisticCharacters.length === 0) {
		return (
			<EmptyState
				icon={Users}
				title="No hay personajes"
				description="Los personajes te ayudan a organizar tus imágenes. Crea un nuevo personaje desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticCharacters.map((character, index) => (
						<motion.div
							key={character.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<CharacterCard
								character={{
									...character,
									featuredImage: character.recentImages?.[0] || null,
								}}
								onClick={() => handleCharacterClick(character)}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
