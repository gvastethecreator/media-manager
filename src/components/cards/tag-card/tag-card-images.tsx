'use client';

import { ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRecentTagImages } from './tag-server-actions';

interface TagCardImagesProps {
	tagId: string;
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
 * Componente para mostrar las imágenes recientes asociadas a una etiqueta
 * Similar a la ilustración de una carta Magic pero con una disposición especial para etiquetas
 */
export function TagCardImages({
	tagId,
	primaryColor,
	secondaryColor,
}: TagCardImagesProps) {
	// Estado para almacenar las imágenes
	const [images, setImages] = useState<ThumbnailImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar imágenes al montar el componente
	useEffect(() => {
		async function loadImages() {
			try {
				setLoading(true);
				const fetchedImages = await getRecentTagImages(tagId);
				setImages(fetchedImages);
				setError(null);
			} catch (err) {
				console.error('Error loading tag images:', err);
				setError('No se pudieron cargar las imágenes');
			} finally {
				setLoading(false);
			}
		}

		loadImages();
	}, [tagId]);

	// Elemento placeholder para cuando no hay imágenes
	const renderPlaceholder = () => (
		<div className="flex flex-col items-center justify-center h-full">
			<ImageIcon
				className="text-muted-foreground mb-2"
				style={{ color: `${primaryColor}70` }}
			/>
			<p className="text-xs text-muted-foreground text-center" style={{ color: `${primaryColor}90` }}>
				{error || 'No hay imágenes con esta etiqueta'}
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

	// Renderizar mosaico de imágenes - diseño especial para etiquetas
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

			{/* Grid de imágenes con efecto de mosaico etiquetado */}
			<div className="grid grid-cols-3 grid-rows-2 gap-px h-full">
				{images.slice(0, 6).map((image, index) => (
					<div
						key={image.id}
						className="relative overflow-hidden bg-black/20"
					>
						{/* Imagen */}
						<img
							src={image.thumbnailUrl}
							alt={image.name || 'Imagen etiquetada'}
							className="w-full h-full object-cover"
							loading="lazy"
							style={{
								opacity: 0.9,
								// Efectos específicos de etiqueta: borde sutil y tratamiento de imágen
								filter: `contrast(1.05) ${index % 2 === 0 ? 'saturate(1.1)' : 'saturate(0.9)'}`
							}}
						/>

						{/* Corner tag emblem en cada imagen */}
						<div
							className="absolute top-0 left-0 w-[20px] h-[20px] opacity-70"
							style={{
								background: primaryColor,
								clipPath: 'polygon(0 0, 100% 0, 0 100%)'
							}}
						/>

						{/* Overlay sutil */}
						<div
							className="absolute inset-0 pointer-events-none"
							style={{
								boxShadow: `inset 0 0 0 1px ${primaryColor}30`,
								background: `linear-gradient(135deg, ${primaryColor}20, transparent)`
							}}
						/>
					</div>
				))}
			</div>
		</div>
	);
}