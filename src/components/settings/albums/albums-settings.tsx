'use client';

import { AlbumForm } from '@/components/features/entity-cards/forms/album-form';
import {
	type AlbumFormData,
	albumToFormData,
	formDataToAlbum,
} from '@/components/features/entity-cards/forms/entity-types';
import { AlbumCard } from '@/components/features/entity-cards/layouts/album-card-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, type StatsCardProps } from '@/components/ui/stats-card';
import { logger } from '@/lib/logger/logger';
import { toastService } from '@/lib/services/toast.service';
import { useAlbumsStore } from '@/store/entities/albums.store';
import { Album as AlbumIcon, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';

const albumLogger = logger.withContext('AlbumsSettings');

export function AlbumsSettings() {
	const { albums, isLoading, error, loadAlbums, createAlbum, updateAlbum, deleteAlbum } = useAlbumsStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);

	React.useEffect(() => {
		loadAlbums();
	}, [loadAlbums]);

	const handleCreate = async (data: AlbumFormData) => {
		try {
			albumLogger.info('✨ Creando nuevo álbum:', data);
			await createAlbum(formDataToAlbum(data));
			toastService.success('El álbum se ha creado correctamente.');
		} catch (error) {
			albumLogger.error('❌ Error al crear álbum:', error);
			toastService.error('No se pudo crear el álbum.');
		}
	};

	const handleUpdate = async (data: AlbumFormData) => {
		if (!data.id) {
			return;
		}
		try {
			albumLogger.info('💾 Actualizando álbum:', data);
			await updateAlbum(data.id, {
				...formDataToAlbum(data),
				id: data.id,
			});
			setEditingId(null);
			toastService.success('El álbum se ha actualizado correctamente.');
		} catch (error) {
			albumLogger.error('❌ Error al actualizar álbum:', error);
			toastService.error('No se pudo actualizar el álbum.');
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar este álbum?')) {
			return;
		}
		try {
			albumLogger.info('🗑️ Eliminando álbum:', { id });
			await deleteAlbum(id);
			toastService.success('El álbum se ha eliminado correctamente.');
		} catch (error) {
			albumLogger.error('❌ Error al eliminar álbum:', error);
			toastService.error('No se pudo eliminar el álbum.');
		}
	};

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		const totalImages = albums.reduce((acc, album) => acc + (album._count?.images || 0), 0);
		const totalSize = albums.reduce((acc, album) => acc + (album.totalSize || 0), 0);

		// Ordenar álbumes por número de imágenes
		const sortedAlbums = [...albums].sort((a, b) => (b._count?.images || 0) - (a._count?.images || 0));

		// Calcular distribución por rango de imágenes
		const distribution = [
			{ name: '0 imágenes', count: 0 },
			{ name: '1-10 imágenes', count: 0 },
			{ name: '11-50 imágenes', count: 0 },
			{ name: '51-100 imágenes', count: 0 },
			{ name: '100+ imágenes', count: 0 },
		];

		for (const album of albums) {
			const count = album._count?.images || 0;
			if (count === 0) {
				distribution[0].count++;
			} else if (count <= 10) {
				distribution[1].count++;
			} else if (count <= 50) {
				distribution[2].count++;
			} else if (count <= 100) {
				distribution[3].count++;
			} else {
				distribution[4].count++;
			}
		}

		return {
			totalItems: albums.length,
			totalImages,
			totalSize,
			lastUpdated: sortedAlbums[0]?.lastUpdated,
			recentItems: sortedAlbums.slice(0, 5).map((album) => ({
				id: album.id,
				name: album.name,
				emoji: album.emoji || '📷',
				count: album._count?.images || 0,
			})),
			distribution: distribution.filter((d) => d.count > 0),
		};
	}, [albums]);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<AlbumIcon className="h-5 w-5" />
							Crear nuevo álbum
						</CardTitle>
					</CardHeader>
					<CardContent>
						<AlbumForm onSubmit={handleCreate} isLoading={isLoading} />
					</CardContent>
				</Card>

				<StatsCard
					title="Estadísticas"
					icon={<AlbumIcon className="h-5 w-5" />}
					isLoading={isLoading}
					stats={stats as StatsCardProps['stats']}
				/>
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<AlbumIcon className="h-5 w-5" />
							Álbumes
						</div>
						<Button variant="outline" size="sm" onClick={() => loadAlbums()} disabled={isLoading}>
							{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recargar'}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && albums.length === 0 ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<p className="text-sm text-muted-foreground text-center">{error}</p>
							<Button variant="outline" size="sm" onClick={() => loadAlbums()}>
								Reintentar
							</Button>
						</div>
					) : albums.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<AlbumIcon className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground text-center">No hay álbumes creados</p>
							<p className="text-xs text-muted-foreground/75">Crea un álbum para organizar tus imágenes</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
							<AnimatePresence>
								{albums.map((album) => (
									<motion.div
										key={album.id}
										layout
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{
											duration: 0.2,
											ease: 'easeInOut',
										}}
									>
										{editingId === album.id ? (
											<Card className="relative">
												<CardContent className="p-4">
													<AlbumForm
														initialData={albumToFormData(album)}
														onSubmit={handleUpdate}
														onCancel={() => setEditingId(null)}
														isLoading={isLoading}
													/>
												</CardContent>
											</Card>
										) : (
											<AlbumCard data={album} onEdit={() => setEditingId(album.id)} onDelete={handleDelete} />
										)}
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
