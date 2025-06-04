'use client';

import { getAlbums, type AlbumWithStats } from '@/app/actions/albums/album.actions';
import { AlbumCard } from '@/components/cards/album-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAlbumStore } from '@/store/entities/album';
import { Album as AlbumIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('AlbumsView');

// Definir el tipo para álbumes con estadísticas
interface AlbumDetails {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	updatedAt: Date | string;
	_count?: { images: number };
}

// Componente memoizado para cada tarjeta de álbum
const MemoizedAlbumCard = React.memo(
	({
		album,
		onAlbumClick,
	}: {
		album: AlbumWithStats;
		onAlbumClick: () => void;
	}) => {
		// Asegurarse de que el álbum tenga todas las propiedades requeridas
		const completeAlbum = {
			...album,
			emoji: album.emoji || '📔',
			color: album.color || '#10b981',
		};

		return <AlbumCard album={completeAlbum} onClick={onAlbumClick} className="h-full" />;
	},
	(prevProps, nextProps) => {
		// Memoización personalizada para solo re-renderizar si cambian propiedades importantes
		return (
			prevProps.album.id === nextProps.album.id &&
			prevProps.album.name === nextProps.album.name &&
			prevProps.album.updatedAt === nextProps.album.updatedAt
		);
	}
);

// Para evitar advertencias de displayName
MemoizedAlbumCard.displayName = 'MemoizedAlbumCard';

export function AlbumsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { selectAlbum, openViewer } = useAlbumStore();
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
			// Usando type assertion para acceder a propiedades que sabemos que existen
			// pero TypeScript no puede inferir del tipo
			const albumData = album as any;
			viewLogger.info('🖱️ Click en álbum:', albumData.name);
			setCurrentView('album-content');

			// Seleccionar el álbum y abrir el visor
			selectAlbum(albumData.id);
			openViewer(albumData.id);
		},
		[setCurrentView, selectAlbum, openViewer]
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
					{optimisticAlbums.map((album, index) => {
						// Verificar que el álbum tenga un id válido
						if (!album || !(album as any).id) {
							console.error('Álbum sin id válido:', album);
							return null;
						}

						// Crear una función de clic específica para este álbum
						const onAlbumClick = () => handleAlbumClick(album);

						return (
							<motion.div
								key={(album as any).id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="perspective-1000"
							>
								<div
									className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
									data-album-id={(album as any).id}
								>
									<MemoizedAlbumCard
										album={album}
										onAlbumClick={onAlbumClick}
									/>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}
