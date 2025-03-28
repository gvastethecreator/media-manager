'use client';

import { MapIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRecentPlaceImages } from './place-server-actions';

interface PlaceCardImagesProps {
	placeId: string;
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
 * Componente para mostrar las imágenes recientes asociadas a un lugar
 * Similar a la ilustración de una carta Magic pero con un diseño específico para lugares
 */
export function PlaceCardImages({
	placeId,
	primaryColor,
	secondaryColor,
}: PlaceCardImagesProps) {
	// Estado para almacenar las imágenes
	const [images, setImages] = useState<ThumbnailImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar imágenes al montar el componente
	useEffect(() => {
		async function loadImages() {
			try {
				setLoading(true);
				const fetchedImages = await getRecentPlaceImages(placeId);
				setImages(fetchedImages);
				setError(null);
			} catch (err) {
				console.error('Error loading place images:', err);
				setError('No se pudieron cargar las imágenes');
			} finally {
				setLoading(false);
			}
		}

		loadImages();
	}, [placeId]);

	// Elemento placeholder para cuando no hay imágenes
	const renderPlaceholder = () => (
		<div className="flex flex-col items-center justify-center h-full">
			<MapIcon
				className="text-muted-foreground mb-2"
				style={{ color: `${primaryColor}70` }}
			/>
			<p className="text-xs text-muted-foreground text-center" style={{ color: `${primaryColor}90` }}>
				{error || 'No hay imágenes de este lugar'}
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

	// Renderizar mosaico de imágenes - diseño especial para lugares
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

			{/* Grid de imágenes con efecto de panorama para lugares */}
			<div className="grid grid-cols-4 grid-rows-1 gap-px h-full">
				{images.slice(0, 4).map((image, index) => (
					<div
						key={image.id}
						className="relative overflow-hidden bg-black/20"
					>
						{/* Imagen */}
						<img
							src={image.thumbnailUrl}
							alt={image.name || 'Imagen del lugar'}
							className="w-full h-full object-cover"
							loading="lazy"
							style={{
								opacity: 0.9,
								// Efectos específicos de lugar: panorámica con diferentes brillos
								filter: `brightness(${1 + (index * 0.05)}) contrast(1.05)`
							}}
						/>

						{/* Overlay con gradiente para simular paisaje */}
						<div
							className="absolute inset-0"
							style={{
								boxShadow: `inset 0 0 0 1px ${primaryColor}30`,
								background: `linear-gradient(to bottom, transparent 70%, ${primaryColor}40 100%)`,
								opacity: 0.7,
							}}
						/>
					</div>
				))}

				{/* Rellenar los espacios vacíos si hay menos de 4 imágenes */}
				{images.length < 4 && Array.from({ length: 4 - images.length }).map((_, index) => (
					<div
						key={`placeholder-${index}`}
						className="bg-black/20 flex items-center justify-center"
					>
						<MapIcon className="opacity-20 h-6 w-6" />
					</div>
				))}
			</div>

			{/* Overlay principal - efecto de panorama unificado */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					boxShadow: `inset 0 -4px 8px ${primaryColor}20`,
					background: `linear-gradient(to bottom, transparent 80%, ${primaryColor}30 100%)`,
					opacity: 0.6,
				}}
			/>
		</div>
	);
}