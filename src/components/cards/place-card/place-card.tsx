'use client';

import { cn } from '@/lib/utils';
import { memo, useState } from 'react';
import { PlaceCardContent } from './place-card-content';
import { PlaceCardFooter } from './place-card-footer';
import { PlaceCardHeader } from './place-card-header';
import { PlaceCardImages } from './place-card-images';

export interface PlaceCardProps {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	featuredImage?: string | null;
	region?: string;
	type?: string;
	climate?: string;
	population?: number;
	government?: string;
	createdAt?: Date;
	updatedAt?: Date;
	imagesCount?: number;
	isFavorite?: boolean;
	onClick?: () => void;
	className?: string;
}

/**
 * Componente de tarjeta de lugar inspirado en cartas Magic
 * Muestra información de un lugar con un diseño similar a una carta Magic
 */
export function PlaceCard({
	id,
	name,
	emoji = '📍',
	color = '#10b981', // Verde por defecto para lugares
	description,
	featuredImage,
	region = 'desconocido',
	type = 'desconocido',
	climate = 'templado',
	population = 0,
	government = 'desconocido',
	createdAt,
	updatedAt,
	imagesCount = 0,
	isFavorite = false,
	onClick,
	className,
}: PlaceCardProps) {
	// Convertir el color hexadecimal a formato RGB para manipulaciones
	const hexToRgb = (hex: string) => {
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
		return result
			? {
				r: Number.parseInt(result[1], 16),
				g: Number.parseInt(result[2], 16),
				b: Number.parseInt(result[3], 16),
			}
			: { r: 59, g: 130, b: 246 }; // Color azul por defecto
	};

	// Calcular colores primario y secundario
	const primaryColor = color;
	const rgbPrimary = hexToRgb(primaryColor);

	// Color secundario: variación del primario
	const secondaryColor = `rgb(${Math.max(0, rgbPrimary.r - 30)}, ${Math.max(0, rgbPrimary.g - 30)}, ${Math.max(
		0,
		rgbPrimary.b - 30
	)})`;

	// Textura de la carta
	const [texture] = useState('classic'); // Para futuras personalizaciones

	// Manejar clic en la tarjeta
	const handleClick = () => {
		if (onClick) {
			onClick();
		}
	};

	return (
		<div
			className={cn(
				'group relative flex flex-col rounded-md overflow-hidden border shadow-md hover:shadow-lg transition-all duration-300',
				'bg-card text-card-foreground hover:scale-[1.02]',
				'cursor-pointer select-none h-[420px] max-w-[300px] mx-auto',
				className
			)}
			onClick={handleClick}
			style={{
				// Borde con el color primario
				borderColor: `${primaryColor}90`,
				// Sombra con el color primario
				boxShadow: `0 4px 6px -1px ${primaryColor}30, 0 2px 4px -2px ${primaryColor}20`,
			}}
		>
			{/* Cabecera: nombre, emoji, región y tipo del lugar */}
			<PlaceCardHeader
				name={name}
				emoji={emoji}
				region={region}
				type={type}
				climate={climate}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				isFavorite={isFavorite}
			/>

			{/* Imágenes del lugar como ilustración */}
			<PlaceCardImages
				placeId={id}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>

			{/* Contenido: descripción y detalles del lugar */}
			<PlaceCardContent
				description={description}
				government={government}
				population={population}
				primaryColor={primaryColor}
			/>

			{/* Pie: información adicional, fecha de creación, conteo de imágenes */}
			<PlaceCardFooter
				createdAt={createdAt}
				updatedAt={updatedAt}
				imagesCount={imagesCount}
				climate={climate}
				texture={texture}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>
		</div>
	);
}

// Versión memoizada para optimizar renders
export const MemoizedPlaceCard = memo(PlaceCard);