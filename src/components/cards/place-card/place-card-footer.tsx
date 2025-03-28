'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cloud, ImageIcon } from 'lucide-react';

interface PlaceCardFooterProps {
	createdAt?: Date;
	updatedAt?: Date;
	imagesCount: number;
	climate: string;
	texture?: string;
	primaryColor: string;
	secondaryColor: string;
}

/**
 * Componente de pie para la tarjeta de lugar
 * Muestra información de fechas, clima y estadísticas
 */
export function PlaceCardFooter({
	createdAt,
	updatedAt,
	imagesCount,
	climate,
	texture,
	primaryColor,
	secondaryColor,
}: PlaceCardFooterProps) {
	// Formatear fechas
	const formatDate = (date?: Date) => {
		if (!date) return 'Desconocido';
		return format(new Date(date), 'MMM d, yyyy', { locale: es });
	};

	// Formatear clima para display
	const formatClimate = (climate: string) => {
		if (!climate || climate === 'unknown' || climate === 'desconocido') {
			return 'Desconocido';
		}
		return climate.charAt(0).toUpperCase() + climate.slice(1).toLowerCase();
	};

	// Crear una versión abreviada para mostrar en la tarjeta
	const createDateFormatted = formatDate(createdAt);
	const updateDateFormatted = formatDate(updatedAt);
	const climateFormatted = formatClimate(climate);

	return (
		<div
			className="pt-1 pb-1.5 px-2.5 text-xs border-t flex items-center justify-between"
			style={{
				borderColor: `${primaryColor}30`,
				background: `linear-gradient(0deg, ${primaryColor}15, transparent)`
			}}
		>
			{/* Sección izquierda - Clima */}
			<div className="flex items-center">
				<Cloud size={14} className="mr-1" />
				<div
					className="font-medium truncate max-w-[80px]"
					style={{ color: primaryColor }}
				>
					{climateFormatted}
				</div>
			</div>

			{/* Sección central - Contador de imágenes */}
			<div className="flex items-center">
				<ImageIcon size={14} className="mr-1" />
				<span className="text-muted-foreground">
					{imagesCount} {imagesCount === 1 ? 'imagen' : 'imágenes'}
				</span>
			</div>

			{/* Sección derecha - Textura si está disponible */}
			{texture && (
				<div
					className="px-1.5 rounded-sm font-medium"
					style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
				>
					{texture}
				</div>
			)}

			{/* Línea de información adicional */}
			<div
				className="absolute bottom-0 left-0 right-0 px-2.5 py-0.5 text-[10px] flex justify-between text-muted-foreground border-t"
				style={{ borderColor: `${primaryColor}20` }}
			>
				<div>
					<span>Creado: {createDateFormatted}</span>
				</div>
				{updatedAt && updatedAt > createdAt && (
					<div>
						<span>Actualizado: {updateDateFormatted}</span>
					</div>
				)}
			</div>
		</div>
	);
}