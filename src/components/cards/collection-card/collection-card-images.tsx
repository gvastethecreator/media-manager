'use client';

import { ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRecentCollectionImages } from './collection-server-actions';

interface CollectionCardImagesProps {
	collectionId: string;
	primaryColor: string;
	secondaryColor: string;
}

interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Componente para mostrar las imágenes recientes de una colección
 * Similar a la ilustración de una carta Magic
 */
export function CollectionCardImages({
	collectionId,
	primaryColor,
	secondaryColor,
}: CollectionCardImagesProps) {
	// Estado para almacenar las imágenes
	const [images, setImages] = useState<ThumbnailImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar imágenes al montar el componente
	useEffect(() => {
		async function loadImages() {
			try {
				setLoading(true);
				const fetchedImages = await getRecentCollectionImages(collectionId);
				setImages(fetchedImages);
				setError(null);
			} catch (err) {
				console.error('Error loading collection images:', err);
				setError('No se pudieron cargar las imágenes');
			} finally {
				setLoading(false);
			}
		}

		loadImages();
	}, [collectionId]);

	// Elemento placeholder para cuando no hay imágenes
	const renderPlaceholder = () => (
		<div className="flex flex-col items-center justify-center h-full">
			<ImageIcon
				className="text-muted-foreground mb-2"
				style={{ color: `${primaryColor}70` }}
			/>
			<p className="text-xs text-muted-foreground text-center" style={{ color: `${primaryColor}90` }}>
				{error || 'No hay imágenes para mostrar'}
			</p>
		</div>
	);

	// Renderizar loading
	if (loading) {
		return (
			<div
				className="h-[140px] flex-shrink-0 flex items-center justify-center bg-black/5"
				style={{
					borderBottom: `1px solid ${primaryColor}20`,
					background: `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)`
				}}
			>
				<div
					className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
					style={{ borderColor: `${primaryColor}80 transparent ${primaryColor}30 ${primaryColor}30` }}
				/>
			</div>
		);
	}

	// Si no hay imágenes o hay error, mostrar placeholder
	if (error || images.length === 0) {
		return (
			<div
				className="h-[140px] flex-shrink-0 bg-black/5"
				style={{
					borderBottom: `1px solid ${primaryColor}20`,
					background: `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)`
				}}
			>
				{renderPlaceholder()}
			</div>
		);
	}

	// Renderizar grid con las imágenes
	return (
		<div
			className="h-[140px] flex-shrink-0 overflow-hidden relative"
			style={{
				borderBottom: `1px solid ${primaryColor}20`
			}}
		>
			{/* Fondo estilizado */}
			<div
				className="absolute inset-0 -z-10"
				style={{
					background: `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)`
				}}
			/>

			{/* Grid de imágenes */}
			<div className="grid grid-cols-3 grid-rows-2 gap-px h-full">
				{images.slice(0, 6).map((image) => (
					<div
						key={image.id}
						className="relative overflow-hidden bg-black/20"
					>
						{/* Imagen */}
						<img
							src={image.thumbnailUrl}
							alt={image.name || 'Imagen de colección'}
							className="w-full h-full object-cover"
							loading="lazy"
						/>

						{/* Overlay sutil */}
						<div
							className="absolute inset-0 pointer-events-none"
							style={{
								boxShadow: `inset 0 0 0 1px ${primaryColor}30`,
								background: `linear-gradient(135deg, ${primaryColor}10, transparent)`
							}}
						/>
					</div>
				))}
			</div>
		</div>
	);
}