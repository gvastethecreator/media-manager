'use client';

import { getCharacters } from '@/app/actions/characters/character.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { CharacterCard } from '@/components/features/entity-cards/layouts/character-card';
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

// Extender el tipo Character para incluir los campos adicionales
interface CharacterWithDetails {
	id: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	class?: string | null;
	_count?: { images: number };
	recentImages?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export function CharactersView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentCharacter } = useFileManager();
	const [characters, setCharacters] = useState<CharacterWithDetails[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticCharacters, _addEvent] = clientEvents.useEvents<CharacterWithDetails[]>(characters);

	const loadCharacters = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando personajes...');
			const data = await getCharacters();
			const transformedData = data.map((characterData) => {
				// Filtrar valores nulos en recentImages
				const recentImages = characterData.recentImages
					? characterData.recentImages.filter((img): img is string => img !== null)
					: [];

				return {
					...characterData,
					recentImages,
					_count: characterData._count || { images: 0 },
					createdAt: new Date(characterData.createdAt),
					updatedAt: new Date(characterData.updatedAt),
				} as CharacterWithDetails;
			});

			setCharacters(transformedData);
			viewLogger.info(`✅ ${data.length} personajes cargados`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando personajes:', error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadCharacters();
	}, [loadCharacters]);

	const handleCharacterClick = useCallback(
		(character: CharacterWithDetails) => {
			viewLogger.info('🖱️ Click en personaje:', character.name);
			setCurrentView('character-content');
			setCurrentCharacter(character.id);
			// Actualizar la información completa del personaje en el store
			useFileManager.setState({
				currentCharacter: {
					id: character.id,
					name: character.name,
					description: character.description,
					emoji: character.emoji,
					color: character.color,
					category: character.category,
					class: character.class,
					_count: character._count,
					createdAt: character.createdAt,
					updatedAt: character.updatedAt,
				},
			});
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
				title="No hay personajes creados"
				description="Crea personajes para organizar tus imágenes por personaje."
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
								data={character}
								onClick={() => handleCharacterClick(character)}
								options={{
									useImageGrid: true,
									imageGridLayout: 'quad',
									imageGridGap: 4,
									imageGridStyle: 'standard',
									enableGlow: true,
									enableBorderEffect: true,
								}}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
