import { ImageOffIcon, VideoIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentCollectionMedia } from '@/lib/api/collections';

interface CollectionCardImagesProps {
	collectionId: string;
	primaryColor: string;
	secondaryColor?: string;
}

/**
 * Componente para mostrar imágenes y videos recientes de una colección.
 * Diseñado con estilo TCG para la sección de "ilustración" de la carta.
 */
export function CollectionCardImages({ collectionId, primaryColor, secondaryColor }: CollectionCardImagesProps) {
	const { data: thumbnails, isLoading: loading } = useRecentCollectionMedia(collectionId);

	// Calcular color secundario derivado si no se proporciona
	const derivedSecondaryColor = secondaryColor || `${primaryColor}90`;

	// Ordenamos para mostrar primero las imágenes
	const sortedThumbnails = thumbnails
		? [...thumbnails].sort((a, b) => (a.isVideo === b.isVideo ? 0 : a.isVideo ? 1 : -1))
		: [];

	// Placeholder para mostrar cuando no hay imágenes
	const renderPlaceholder = () => (
		<div className="flex h-full items-center justify-center p-4 text-center" style={{ color: `${primaryColor}80` }}>
			<div className="flex flex-col items-center gap-2">
				<ImageOffIcon className="h-10 w-10 opacity-40" />
				<p className="text-xs opacity-60">No hay imágenes disponibles</p>
			</div>
		</div>
	);

	// Render de estado de carga
	if (loading) {
		return (
			<div className="relative h-24 p-1">
				<div
					className="absolute inset-0 z-0 opacity-30"
					style={{
						background: `linear-gradient(135deg, ${primaryColor}30, ${derivedSecondaryColor}40)`,
					}}
				/>
				<div className="relative z-10 grid h-full grid-cols-3 gap-1">
					<Skeleton className="h-full w-full rounded-sm bg-primary/10" />
					<Skeleton className="h-full w-full rounded-sm bg-primary/10" />
					<Skeleton className="h-full w-full rounded-sm bg-primary/10" />
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-24 p-1">
			{/* Fondo decorativo para la sección de imágenes */}
			<div
				className="absolute inset-0 z-0 opacity-30"
				style={{
					background: `linear-gradient(135deg, ${primaryColor}30, ${derivedSecondaryColor}40)`,
				}}
			/>

			{/* Marco decorativo */}
			<div
				className="pointer-events-none absolute inset-0 z-10 rounded-sm border-2 border-dashed opacity-20"
				style={{ borderColor: primaryColor }}
			/>

			{/* Contenedor de imágenes */}
			<div className="relative z-1 grid h-full grid-cols-3 gap-1">
				{sortedThumbnails.length > 0
					? // Mostrar hasta 3 imágenes
						sortedThumbnails
							.slice(0, 3)
							.map((thumbnail, idx) => (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="relative h-full overflow-hidden rounded-sm bg-black/30 shadow-sm"
									initial={{ opacity: 0, y: 10 }}
									key={thumbnail.id}
									transition={{ duration: 0.3, delay: idx * 0.1 }}
								>
									<img alt="" className="h-full w-full object-cover" loading="lazy" src={thumbnail.thumbnailUrl} />
									{/* Indicador para videos */}
									{thumbnail.isVideo && (
										<div className="absolute right-1 bottom-1 rounded-full bg-black/60 p-0.5">
											<VideoIcon className="h-3 w-3 text-white" />
										</div>
									)}
								</motion.div>
							))
					: // Placeholder cuando no hay imágenes
						renderPlaceholder()}
			</div>

			{/* Partículas decorativas estilo TCG */}
			<div
				className="-bottom-1 absolute right-2 z-10 h-4 w-4 rounded-full opacity-60"
				style={{ backgroundColor: primaryColor }}
			/>
			<div
				className="-top-1 absolute left-2 z-10 h-2 w-2 rounded-full opacity-60"
				style={{ backgroundColor: derivedSecondaryColor }}
			/>
		</div>
	);
}
