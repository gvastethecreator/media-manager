'use client';

import { type CharacterWithStats, searchCharacters } from '@/app/actions/characters/character.actions';
import { CharacterCard } from '@/components/cards/character-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCharacterStore } from '@/store/entities/character';
import { Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';
import { getCharacterVisualConfig } from '@/app/actions/visual-config.actions';

const viewLogger = clientLogger.withContext('CharactersView');

// Configuración visual simplificada para personajes
const DEFAULT_CHARACTER_OPTIONS: CardOptions = {
	primaryColor: '#f59e0b',
	secondaryColor: '#ef4444',
};

export function CharactersView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { selectCharacter } = useCharacterStore();
	const [characters, setCharacters] = useState<CharacterWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_CHARACTER_OPTIONS);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticCharacters, _addEvent] = clientEvents.useEvents<CharacterWithStats[]>(characters);

	const loadCharacters = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando personajes...');
			const data = await searchCharacters({});
			setCharacters(data);
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

        useEffect(() => {
                const loadVisualConfig = async () => {
                        try {
                                const config = await getCharacterVisualConfig();
                                setVisualConfig({
                                        ...DEFAULT_CHARACTER_OPTIONS,
                                        ...config,
                                });
                        } catch (error) {
                                console.error('Error al cargar la configuración visual:', error);
                                // Si hay un error, mantenemos la configuración predeterminada
                        }
                };

                loadVisualConfig();
        }, []);

	const handleCharacterClick = useCallback(
		(character: CharacterWithStats) => {
			viewLogger.info('🖱️ Click en personaje:', character.name);
			setCurrentView('character-content');
			selectCharacter(character.id);
		},
		[setCurrentView, selectCharacter]
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
							<CharacterCard character={character} onClick={() => handleCharacterClick(character)} className="h-full" />
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
