'use client';

import { getCharacters } from '@/app/actions/characters/character.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('CharactersView');

// Configuración visual predeterminada para personajes
const DEFAULT_CHARACTER_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: true,
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	designSystem: {
		preset: 'character',
		variant: 'default',
		aspectRatio: '2/3',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#f59e0b',
	secondaryColor: '#ef4444',
	hoverLiftHeight: 15,
	maxRotation: 18,
};

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
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_CHARACTER_OPTIONS);

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

	useEffect(() => {
		const loadVisualConfig = async () => {
			try {
				const response = await fetch('/api/entities/characters/visual-config');
				if (!response.ok) {
					throw new Error('Error al cargar la configuración visual');
				}
				const config = await response.json();
				// Combinar la configuración del servidor con las opciones predeterminadas
				setVisualConfig({
					...DEFAULT_CHARACTER_OPTIONS,
					...config,
					// Asegurar que las propiedades anidadas se combinen correctamente
					designSystem: {
						...(DEFAULT_CHARACTER_OPTIONS.designSystem || {}),
						...(config.designSystem || {}),
					},
					layerSystem: {
						...(DEFAULT_CHARACTER_OPTIONS.layerSystem || {}),
						...(config.layerSystem || {}),
					},
				});
			} catch (error) {
				console.error('Error al cargar la configuración visual:', error);
				// Si hay un error, mantenemos la configuración predeterminada
			}
		};

		loadVisualConfig();
	}, []);

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
							<EntityCardAdapter
								entityType="character"
								entity={character}
								onClick={() => handleCharacterClick(character)}
								showVisualConfig={true}
								enableExplode={true}
								options={visualConfig}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
