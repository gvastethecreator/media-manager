'use client';

import { getAlbums } from '@/app/actions/albums/album.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { AlbumCard } from '@/components/features/entity-cards/layouts/album-card-layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import type { Album } from '@prisma/client';
import { Album as AlbumIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('AlbumsView');

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
							<AlbumCard
								data={album}
								onClick={() => handleAlbumClick(album)}
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
