'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ImageOffIcon, VideoIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { getRecentCollectionMedia } from './collection-server-actions';

interface CollectionCardImagesProps {
	collectionId: string;
	primaryColor: string;
	secondaryColor?: string;
	recentImages?: string[];
	recentVideos?: string[];
}

/**
 * Componente para mostrar imágenes y videos recientes de una colección.
 * Diseñado con estilo TCG para la sección de "ilustración" de la carta.
 */
export function CollectionCardImages({
	collectionId,
	primaryColor,
	secondaryColor,
	recentImages = [],
	recentVideos = [],
}: CollectionCardImagesProps) {
	// Estado para manejar las imágenes
	const [loading, setLoading] = useState(!recentImages.length && !recentVideos.length);
	const [thumbnails, setThumbnails] = useState<Array<{
		id: string;
		thumbnailUrl: string;
		url?: string;
		isVideo?: boolean;
	}>>([]);

	// Calcular color secundario derivado si no se proporciona
	const derivedSecondaryColor = secondaryColor || `${primaryColor}90`;

	// Efecto para cargar imágenes si no se proporcionaron
	useEffect(() => {
		// Si ya tenemos imágenes o videos proporcionados, usarlos
		if (recentImages.length > 0 || recentVideos.length > 0) {
			const combinedMedia = [
				...recentImages.map(url => ({
					id: url.split('/').pop() || 'img-fallback',
					thumbnailUrl: url,
					isVideo: false
				})),
				...recentVideos.map(url => ({
					id: url.split('/').pop() || 'video-fallback',
					thumbnailUrl: url,
					isVideo: true
				}))
			];

			setThumbnails(combinedMedia);
			setLoading(false);
			return;
		}

		// Si no tenemos imágenes proporcionadas, cargarlas desde el servidor
		async function fetchThumbnails() {
			try {
				setLoading(true);
				// Obtener imágenes recientes de la colección
				const media = await getRecentCollectionMedia(collectionId);
				setThumbnails(media);
			} catch (error) {
				console.error('Error fetching collection thumbnails:', error);
			} finally {
				setLoading(false);
			}
		}

		if (collectionId) {
			fetchThumbnails();
		}
	}, [collectionId, recentImages, recentVideos]);

	// Ordenamos para mostrar primero las imágenes
	const sortedThumbnails = [...thumbnails].sort((a, b) => (a.isVideo === b.isVideo ? 0 : a.isVideo ? 1 : -1));

	// Placeholder para mostrar cuando no hay imágenes
	const renderPlaceholder = () => (
		<div
			className="h-full flex items-center justify-center p-4 text-center"
			style={{ color: `${primaryColor}80` }}
		>
			<div className="flex flex-col items-center gap-2">
				<ImageOffIcon className="w-10 h-10 opacity-40" />
				<p className="text-xs opacity-60">No hay imágenes disponibles</p>
			</div>
		</div>
	);

	// Render de estado de carga
	if (loading) {
		return (
			<div className="h-24 p-1 relative">
				<div
					className="absolute inset-0 z-0 opacity-30"
					style={{
						background: `linear-gradient(135deg, ${primaryColor}30, ${derivedSecondaryColor}40)`,
					}}
				/>
				<div className="relative z-10 grid grid-cols-3 gap-1 h-full">
					<Skeleton className="h-full w-full rounded-sm bg-primary/10" />
					<Skeleton className="h-full w-full rounded-sm bg-primary/10" />
					<Skeleton className="h-full w-full rounded-sm bg-primary/10" />
				</div>
			</div>
		);
	}

	return (
		<div className="h-24 p-1 relative">
			{/* Fondo decorativo para la sección de imágenes */}
			<div
				className="absolute inset-0 z-0 opacity-30"
				style={{
					background: `linear-gradient(135deg, ${primaryColor}30, ${derivedSecondaryColor}40)`,
				}}
			/>

			{/* Marco decorativo */}
			<div
				className="absolute inset-0 border-2 border-dashed rounded-sm pointer-events-none z-10 opacity-20"
				style={{ borderColor: primaryColor }}
			/>

			{/* Contenedor de imágenes */}
			<div className="relative z-1 grid grid-cols-3 gap-1 h-full">
				{sortedThumbnails.length > 0 ? (
					// Mostrar hasta 3 imágenes
					sortedThumbnails.slice(0, 3).map((thumbnail, idx) => (
						<motion.div
							key={thumbnail.id}
							className="h-full rounded-sm overflow-hidden shadow-sm bg-black/30 relative"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: idx * 0.1 }}
						>
							<img
								src={thumbnail.thumbnailUrl}
								alt=""
								className="w-full h-full object-cover"
								loading="lazy"
							/>
							{/* Indicador para videos */}
							{thumbnail.isVideo && (
								<div className="absolute bottom-1 right-1 bg-black/60 p-0.5 rounded-full">
									<VideoIcon className="w-3 h-3 text-white" />
								</div>
							)}
						</motion.div>
					))
				) : (
					// Placeholder cuando no hay imágenes
					renderPlaceholder()
				)}
			</div>

			{/* Partículas decorativas estilo TCG */}
			<div className="absolute -bottom-1 right-2 w-4 h-4 rounded-full opacity-60 z-10"
				style={{ backgroundColor: primaryColor }} />
			<div className="absolute -top-1 left-2 w-2 h-2 rounded-full opacity-60 z-10"
				style={{ backgroundColor: derivedSecondaryColor }} />
		</div>
	);
}