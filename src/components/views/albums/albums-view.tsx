'use client';

import { getAlbums, type AlbumWithStats } from '@/app/actions/albums/album.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { getCardOptionsFromPreset } from '@/components/features/entity-cards/actions/visual-presets.actions';
import { EntityCardAdapter } from '@/components/features/entity-cards/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import { Album as AlbumIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('AlbumsView');

// Configuración visual simplificada para álbumes
const DEFAULT_ALBUM_OPTIONS: CardOptions = {
	primaryColor: '#3b82f6',
	secondaryColor: '#8b5cf6',
};

export function AlbumsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentAlbum } = useFileManager();
	const [albums, setAlbums] = useState<AlbumWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_ALBUM_OPTIONS);
	const [albumPresets, setAlbumPresets] = useState<Record<string, CardOptions>>({});

	// Usar el hook de eventos optimistas del cliente
	const [optimisticAlbums, _addEvent] = clientEvents.useEvents<AlbumWithStats[]>(albums);

	// Función para cargar la configuración de un preset
	const loadPresetConfig = useCallback(async (presetId: string): Promise<CardOptions | null> => {
		try {
			const response = await getCardOptionsFromPreset(presetId, 'album');
			if (response.success && response.data) {
				return response.data as CardOptions;
			}
			return null;
		} catch (error) {
			viewLogger.error('❌ Error cargando preset:', error);
			return null;
		}
	}, []);

	const loadAlbums = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando álbumes...');
			const data = await getAlbums();

			// Establecer los álbumes tal como vienen de la API
			setAlbums(data);
			viewLogger.info(`✅ ${data.length} álbumes cargados`);

			// Cargar presets para cada álbum que tenga presetId
			const presets: Record<string, CardOptions> = {};
			const presetsToLoad = data.filter(album => album.presetId);

			if (presetsToLoad.length > 0) {
				viewLogger.info(`🔄 Cargando ${presetsToLoad.length} presets para álbumes...`);

				// Cargar presets en paralelo
				const presetPromises = presetsToLoad.map(async (album) => {
					if (album.presetId) {
						const presetOptions = await loadPresetConfig(album.presetId);
						if (presetOptions) {
							// En AlbumWithStats, sabemos que existe una propiedad 'id' desde PrismaAlbum
							presets[(album as any).id] = presetOptions;
						}
					}
				});

				await Promise.all(presetPromises);
				viewLogger.info(`✅ ${Object.keys(presets).length} presets cargados`);
			}

			setAlbumPresets(presets);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando álbumes:', error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [loadPresetConfig]);

	useEffect(() => {
		loadAlbums();
	}, [loadAlbums]);

	useEffect(() => {
		const loadVisualConfig = async () => {
			try {
				const response = await fetch('/api/entities/albums/visual-config');
				if (!response.ok) {
					throw new Error('Error al cargar la configuración visual');
				}
				const config = await response.json();
				// Combinar la configuración del servidor con las opciones predeterminadas
				setVisualConfig({
					...DEFAULT_ALBUM_OPTIONS,
					...config
				});
			} catch (error) {
				console.error('Error al cargar la configuración visual:', error);
				// Si hay un error, mantenemos la configuración predeterminada
			}
		};

		loadVisualConfig();
	}, []);

	const handleAlbumClick = useCallback(
		(album: AlbumWithStats) => {
			// Usando type assertion para acceder a propiedades que sabemos que existen
			// pero TypeScript no puede inferir del tipo
			const albumData = album as any;
			viewLogger.info('🖱️ Click en álbum:', albumData.name);
			setCurrentView('album-content');
			setCurrentAlbum(albumData.id);
			// Actualizar la información completa del álbum en el store
			useFileManager.setState({
				currentAlbum: {
					id: albumData.id,
					name: albumData.name,
					emoji: albumData.emoji || '📔',
					count: album._count?.images || 0
				},
			});
		},
		[setCurrentView, setCurrentAlbum]
	);

	// Modificar la función para obtener opciones de tarjeta para un álbum específico
	const getAlbumCardOptions = useCallback((albumId: string): CardOptions => {
		// Si el álbum tiene un preset personalizado, usarlo
		if (albumPresets[albumId]) {
			return albumPresets[albumId];
		}
		// Si no, usar la configuración por defecto
		return visualConfig;
	}, [albumPresets, visualConfig]);

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

	if (!optimisticAlbums || optimisticAlbums.length === 0) {
		return (
			<EmptyState
				icon={AlbumIcon}
				title="No hay álbumes creados"
				description="Crea un álbum para organizar tus imágenes."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticAlbums.map((album, index) => {
						// Usar type assertion para acceder a propiedades que sabemos que existen
						const albumData = album as any;
						return (
							<motion.div
								key={albumData.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<EntityCardAdapter
									entityType="album"
									entity={album}
									onClick={() => handleAlbumClick(album)}
									options={getAlbumCardOptions(albumData.id)}
									className="h-full"
								/>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}
