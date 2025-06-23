'use client';

import { EntityCard } from '@/components/cards/entity-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageStore } from '@/store/entities/image';
import type { ImageWithStats } from '@/types/entities/image';
import { Folder, FolderSearch, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo } from 'react';

// Logger para depuración
const logger = clientLogger.withContext('FolderContentView');

const MemoizedEntityCard = React.memo(
	({ image, onImageClick }: { image: ImageWithStats & { entityType: 'image' }; onImageClick: () => void }) => (
		<EntityCard item={image} onClick={onImageClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.image.id === nextProps.image.id &&
		prevProps.image.name === nextProps.image.name &&
		prevProps.image.updatedAt === nextProps.image.updatedAt,
);
MemoizedEntityCard.displayName = 'MemoizedEntityCard';

export function FolderContentView() {
	// 📂 Obtener información de la carpeta actual desde navigation store
	const { currentItem } = useNavigationStore();
	const currentFolderId = currentItem?.id || null;

	// 📂 Usar el store de imágenes para obtener las imágenes de la carpeta
	const {
		images: imagesRecord,
		isLoading,
		error,
		loadImages,
		getSortedImages,
	} = useImageStore((s) => ({
		images: s.images,
		isLoading: s.isLoading,
		error: s.error,
		loadImages: s.loadImages,
		getSortedImages: s.getSortedImages,
	}));

	// 📂 Filtrar imágenes por carpeta actual
	const folderImages = useMemo(() => {
		const allImages = getSortedImages();
		// TODO: Implementar filtro real por folderId cuando esté disponible en el schema
		// Por ahora retornamos todas las imágenes como placeholder
		return allImages.map((image): ImageWithStats & { entityType: 'image' } => ({
			...image,
			entityType: 'image',
		}));
	}, [getSortedImages]);

	const handleImageClick = useCallback((image: ImageWithStats) => {
		logger.info('🖱️ Click en imagen:', image.name);
		// Lógica de navegación o apertura de visor aquí
	}, []);

	const handleForceRefresh = useCallback(async () => {
		logger.info('🔄 Forzando recarga de imágenes');
		try {
			await loadImages();
		} catch (refreshError) {
			logger.error('❌ Error al forzar recarga:', refreshError);
		}
	}, [loadImages]);

	const handleScanFolder = useCallback(async () => {
		logger.warn('⚠️ Función de escaneo directo temporalmente deshabilitada');
		// TODO: Implementar escaneo directo de carpeta
	}, []);

	// 🚀 Cargar imágenes cuando cambie currentFolderId
	useEffect(() => {
		if (currentFolderId) {
			logger.info(`🔄 Cargando imágenes de carpeta: ${currentFolderId}`);
			// TODO: Implementar filtro por carpeta en loadImages
			loadImages();
		}
	}, [currentFolderId, loadImages]);

	// 🛡️ Validación: verificar que hay una carpeta seleccionada
	if (!currentFolderId) {
		logger.warn('⚠️ No hay carpeta seleccionada');
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="No hay carpeta seleccionada"
					description="Selecciona una carpeta desde la vista de carpetas para ver su contenido."
				/>
			</div>
		);
	}

	// Mostrar estado de carga
	if (isLoading) {
		logger.debug('⏳ Mostrando estado de carga');
		return <LoadingScreen />;
	}

	// Mostrar estado de error
	if (error) {
		logger.error('❌ Error al cargar imágenes:', error);
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="Error al cargar imágenes"
					description={`Ha ocurrido un error al cargar las imágenes. ${typeof error === 'string' ? error : 'Error desconocido'}`}
				/>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleForceRefresh}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Reintentar
					</Button>
					<Button variant="outline" size="sm" onClick={handleScanFolder}>
						<FolderSearch className="h-4 w-4 mr-2" />
						Escanear Carpeta
					</Button>
				</div>
			</div>
		);
	}

	// Mostrar estado vacío si no hay imágenes
	if (!folderImages || folderImages.length === 0) {
		logger.debug('📭 Mostrando estado vacío - No hay imágenes');
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="No hay imágenes"
					description={
						currentItem?.count && currentItem.count > 0
							? `Esta carpeta debería tener ${currentItem.count} imágenes pero no se pudieron cargar.`
							: 'Esta carpeta está vacía o no se han indexado imágenes aún.'
					}
				/>

				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleForceRefresh}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Recargar
					</Button>
					<Button variant="outline" size="sm" onClick={handleScanFolder}>
						<FolderSearch className="h-4 w-4 mr-2" />
						Escanear Carpeta
					</Button>
				</div>
			</div>
		);
	}

	// Renderizar galería de imágenes con EntityCard
	return (
		<div className="relative h-full w-full min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
			{/* Controles en la esquina superior derecha */}
			<div className="absolute top-2 right-2 z-10 flex gap-2">
				<Button variant="outline" size="sm" onClick={handleScanFolder}>
					<FolderSearch className="h-4 w-4 mr-2" />
					Escanear
				</Button>
				<Button variant="outline" size="sm" onClick={handleForceRefresh}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Recargar
				</Button>
			</div>

			<ScrollArea className="h-full">
				<div className="container mx-auto p-6 pt-16"> {/* pt-16 para dar espacio a los controles */}
					{/* Header con información de la carpeta */}
					<div className="mb-6">
						<h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
							{currentItem?.emoji && <span className="text-3xl">{currentItem.emoji}</span>}
							{currentItem?.name || 'Carpeta'}
						</h2>
						<p className="text-muted-foreground">
							{folderImages.length} {folderImages.length === 1 ? 'imagen' : 'imágenes'} en esta carpeta
						</p>
						{currentItem?.description && (
							<p className="text-sm text-muted-foreground mt-1">{currentItem.description}</p>
						)}
					</div>

					{/* Grid de imágenes */}
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
						{folderImages.map((image, index) => {
							const onImageClick = () => handleImageClick(image);
							return (
								<motion.div
									key={image.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05, duration: 0.3 }}
									className="perspective-1000"
								>
									<div
										className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
										data-image-id={image.id}
									>
										<MemoizedEntityCard image={image} onImageClick={onImageClick} />
									</div>
								</motion.div>
							);
						})}
					</div>

					{/* Footer con información adicional */}
					{folderImages.length > 0 && (
						<div className="mt-8 pt-6 border-t border-border">
							<p className="text-sm text-muted-foreground text-center">
								Mostrando {folderImages.length} {folderImages.length === 1 ? 'imagen' : 'imágenes'} de la carpeta
							</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

/**
 * 📝 Documentación:
 * - Vista optimizada que usa EntityCard TCG con efectos holográficos
 * - Reemplaza FileBrowser por sistema de cards consistente
 * - Integra store Zustand para gestión eficiente de estado
 * - Grid responsivo que se adapta a diferentes tamaños de pantalla
 * - Animaciones escalonadas para carga suave
 * - Lazy loading y memoización para rendimiento óptimo
 * - Controles de recarga y escaneo integrados
 * - Información contextual de la carpeta
 */
