'use client';

import { getAlbums } from '@/app/actions/albums/album.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/file-manager.store';
import type { Album } from '@prisma/client';
import { Album as AlbumIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('AlbumsView');

// Configuración visual predeterminada para álbumes
const DEFAULT_ALBUM_OPTIONS: CardOptions = {
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
		preset: 'album',
		variant: 'default',
		aspectRatio: '5/7',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	// Añadir propiedades necesarias para evitar errores de tipo
	primaryColor: '#3b82f6',
	secondaryColor: '#8b5cf6',
	hoverLiftHeight: 10,
	maxRotation: 15,
};

// Extender el tipo Album para incluir los campos adicionales
interface AlbumWithDetails extends Album {
	_count?: { images: number };
	totalSize?: number;
	recentImages?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export function AlbumsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentAlbum } = useFileManager();
	const [albums, setAlbums] = useState<AlbumWithDetails[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_ALBUM_OPTIONS);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticAlbums, _addEvent] = clientEvents.useEvents<AlbumWithDetails[]>(albums);

	const loadAlbums = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando álbumes...');
			const data = await getAlbums();
			const transformedData = data.map((albumData) => {
				// Filtrar valores nulos en recentImages
				const recentImages = albumData.recentImages
					? albumData.recentImages.filter((img): img is string => img !== null)
					: [];

				return {
					...albumData,
					recentImages,
					_count: albumData._count || { images: 0 },
					createdAt: new Date(albumData.createdAt),
					updatedAt: new Date(albumData.updatedAt),
				} as AlbumWithDetails;
			});

			setAlbums(transformedData);
			viewLogger.info(`✅ ${data.length} álbumes cargados`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando álbumes:', error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

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
					...config,
					// Asegurar que las propiedades anidadas se combinen correctamente
					designSystem: {
						...(DEFAULT_ALBUM_OPTIONS.designSystem || {}),
						...(config.designSystem || {}),
					},
					layerSystem: {
						...(DEFAULT_ALBUM_OPTIONS.layerSystem || {}),
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

	const handleAlbumClick = useCallback(
		(album: AlbumWithDetails) => {
			viewLogger.info('🖱️ Click en álbum:', album.name);
			setCurrentView('album-content');
			setCurrentAlbum(album.id);
			// Actualizar la información completa del álbum en el store
			useFileManager.setState({
				currentAlbum: {
					id: album.id,
					name: album.name,
					description: album.description,
					emoji: album.emoji,
					color: album.color,
					_count: album._count,
					createdAt: album.createdAt,
					updatedAt: album.updatedAt,
				},
			});
		},
		[setCurrentView, setCurrentAlbum]
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
					{optimisticAlbums.map((album, index) => (
						<motion.div
							key={album.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<EntityCardAdapter
								entityType="album"
								entity={album}
								onClick={() => handleAlbumClick(album)}
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
