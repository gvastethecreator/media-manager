import { Album as AlbumIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { AlbumCard } from '@/components/cards/album-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAlbumStore } from '@/store/entities/album';
import type { AlbumWithStats } from '@/types/entities/album';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('AlbumsView');

const MemoizedAlbumCard = React.memo(
	({ album, onAlbumClick }: { album: AlbumWithStats; onAlbumClick: () => void }) => (
		<AlbumCard album={album} onClick={onAlbumClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.album.id === nextProps.album.id &&
		prevProps.album.name === nextProps.album.name &&
		prevProps.album.updatedAt === nextProps.album.updatedAt
);
MemoizedAlbumCard.displayName = 'MemoizedAlbumCard';

export function AlbumsView(_props: ViewProps) {
	// Usar selectores individuales para evitar recrear objetos
	const albumsRecord = useAlbumStore((s) => s.albums);
	const isLoading = useAlbumStore((s) => s.isLoading);
	const error = useAlbumStore((s) => s.error);
	const loadAlbums = useAlbumStore((s) => s.loadAlbums);
	const getSortedAlbums = useAlbumStore((s) => s.getSortedAlbums);

	useEffect(() => {
		if (Object.keys(albumsRecord).length === 0) {
			viewLogger.info('Store de álbumes vacío, cargando desde el servidor...');
			loadAlbums();
		}
	}, [loadAlbums, albumsRecord]);

	const handleAlbumClick = useCallback((album: AlbumWithStats) => {
		viewLogger.info('🖱️ Click en álbum:', album.name);
		// Lógica de navegación o apertura de visor aquí
	}, []);

	// Cachear el resultado de getSortedAlbums
	const sortedAlbums = useMemo(() => {
		return getSortedAlbums();
	}, [getSortedAlbums]); // Dependencias para recalcular cuando cambien

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && Object.keys(albumsRecord).length === 0) {
		return <LoadingScreen />;
	}

	if (sortedAlbums.length === 0) {
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
					{sortedAlbums.map((album, index) => {
						const onAlbumClick = () => handleAlbumClick(album);
						return (
							<motion.div
								key={album.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="perspective-1000"
							>
								<div
									className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
									data-album-id={album.id}
								>
									<MemoizedAlbumCard album={album} onAlbumClick={onAlbumClick} />
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}
