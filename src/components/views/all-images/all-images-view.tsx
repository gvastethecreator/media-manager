import { EntityCard } from '@/components/cards/entity-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageStore } from '@/store/entities/image';
import type { ImageWithStats } from '@/types/entities/image';
import { ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('AllImagesView');

const MemoizedEntityCard = React.memo(
	({ image, onImageClick }: { image: ImageWithStats; onImageClick: () => void }) => (
		<EntityCard entity={image} onClick={onImageClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.image.id === nextProps.image.id &&
		prevProps.image.name === nextProps.image.name &&
		prevProps.image.updatedAt === nextProps.image.updatedAt
);
MemoizedEntityCard.displayName = 'MemoizedEntityCard';

/**
 * Vista principal de todas las imágenes
 * Muestra una galería optimizada con EntityCard TCG y efectos holográficos.
 */
export function AllImagesView(_props: ViewProps) {
	// Usar selectores individuales para evitar recrear objetos
	const imagesRecord = useImageStore((s) => s.images);
	const isLoading = useImageStore((s) => s.isLoading);
	const error = useImageStore((s) => s.error);
	const loadImages = useImageStore((s) => s.loadImages);
	const getSortedImages = useImageStore((s) => s.getSortedImages);

	useEffect(() => {
		if (Object.keys(imagesRecord).length === 0) {
			viewLogger.info('Store de imágenes vacío, cargando desde el servidor...');
			loadImages();
		}
	}, [loadImages, imagesRecord]);

	const handleImageClick = useCallback((image: ImageWithStats) => {
		viewLogger.info('🖱️ Click en imagen:', image.name);
		// Lógica de navegación o apertura de visor aquí
	}, []);

	// Cachear el resultado de getSortedImages
	const sortedImages = useMemo(() => {
		return getSortedImages();
	}, [getSortedImages, imagesRecord]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && Object.keys(imagesRecord).length === 0) {
		return <LoadingScreen />;
	}

	if (sortedImages.length === 0) {
		return (
			<EmptyState
				icon={ImageIcon}
				title="No hay imágenes"
				description="Sube imágenes para comenzar a usar la galería."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				{/* Header con estadísticas */}
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-foreground mb-2">Todas las Imágenes</h2>
					<p className="text-muted-foreground">
						{sortedImages.length} {sortedImages.length === 1 ? 'imagen' : 'imágenes'} en total
					</p>
				</div>

				{/* Grid de imágenes */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
					{sortedImages.map((image, index) => {
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
				{sortedImages.length > 0 && (
					<div className="mt-8 pt-6 border-t border-border">
						<p className="text-sm text-muted-foreground text-center">
							Mostrando {sortedImages.length} {sortedImages.length === 1 ? 'imagen' : 'imágenes'}
						</p>
					</div>
				)}
			</div>
		</ScrollArea>
	);
}

/**
 * 📝 Documentación:
 * - Vista principal optimizada que usa EntityCard TCG con efectos holográficos
 * - Integra store Zustand para gestión eficiente de estado
 * - Grid responsivo que se adapta a diferentes tamaños de pantalla
 * - Animaciones escalonadas para carga suave
 * - Lazy loading y memoización para rendimiento óptimo
 * - Reemplaza FileBrowser por sistema de cards consistente
 * - Estadísticas y información contextual
 */
