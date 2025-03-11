'use client';

import { getAlbums } from '@/app/actions/albums/album.actions';
import type { AlbumWithStats } from '@/app/actions/albums/album.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { AlbumCard } from '@/components/features/entity-cards/album/album-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import { Album as AlbumIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('AlbumsView');

export function AlbumsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentAlbum } = useFileManager();
	const router = useRouter();
	const [albums, setAlbums] = useState<AlbumWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticAlbums, _addEvent] = clientEvents.useEvents<AlbumWithStats[]>(albums);

	const fetchAlbums = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando álbumes...');
			const data = await getAlbums();
			setAlbums(data);
			viewLogger.info(`✅ ${data.length} álbumes cargados`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando álbumes:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar álbumes inicialmente
		fetchAlbums();
	}, [fetchAlbums]);

	const handleAlbumClick = useCallback(
		(album: AlbumWithStats) => {
			viewLogger.info('🖱️ Click en álbum:', album.name);
			setCurrentView('album-content');
			setCurrentAlbum(album.id);
		},
		[setCurrentView, setCurrentAlbum]
	);

	const handleEditAlbum = useCallback(
		(album: AlbumWithStats) => {
			viewLogger.info('⚙️ Editando álbum:', album.name);
			router.push('/settings/albums');
		},
		[router]
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
				title="No hay álbumes"
				description="Los álbumes te ayudan a organizar tus imágenes. Crea un nuevo álbum desde el panel de configuración."
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
							<AlbumCard album={album} onClick={() => handleAlbumClick(album)} onEdit={() => handleEditAlbum(album)} />
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
