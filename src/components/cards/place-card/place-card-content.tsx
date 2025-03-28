'use client';

import { Building2, Users } from 'lucide-react';

interface PlaceCardContentProps {
	description?: string | null;
	government?: string;
	population?: number;
	primaryColor: string;
}

/**
 * Componente de contenido para la tarjeta de lugar
 * Muestra la descripción y detalles del lugar
 */
export function PlaceCardContent({
	description,
	government,
	population = 0,
	primaryColor,
}: PlaceCardContentProps) {
	// Formatea y limita la longitud del texto para evitar desbordamientos
	const formatText = (text: string | null | undefined, maxLength = 150) => {
		if (!text) return '';
		return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
	};

	// Formatear número de población con separadores de miles
	const formatPopulation = (population: number) => {
		if (population <= 0) return 'Desconocida';
		return new Intl.NumberFormat('es-ES').format(population);
	};

	return (
		<div
			className="flex-1 overflow-hidden p-2.5 text-sm"
			style={{
				borderBottom: `1px solid ${primaryColor}30`,
				background: `linear-gradient(180deg, transparent, ${primaryColor}05)`
			}}
		>
			{/* Descripción del lugar */}
			{description ? (
				<div className="mb-3">
					<p className="text-sm text-muted-foreground italic line-clamp-3">
						{formatText(description, 120)}
					</p>
				</div>
			) : (
				<div className="mb-3 italic text-center text-muted-foreground text-sm">
					Sin descripción disponible
				</div>
			)}

			{/* Detalles del lugar - tipo gobierno */}
			<div className="mb-2">
				<div className="flex items-center mb-1">
					<Building2 size={14} className="mr-1" style={{ color: primaryColor }} />
					<h4 className="text-xs font-medium" style={{ color: primaryColor }}>Gobierno</h4>
				</div>
				<p className="text-xs text-muted-foreground line-clamp-1 pl-5">
					{government || 'Desconocido'}
				</p>
			</div>

			{/* Población */}
			<div>
				<div className="flex items-center mb-1">
					<Users size={14} className="mr-1" style={{ color: primaryColor }} />
					<h4 className="text-xs font-medium" style={{ color: primaryColor }}>Población</h4>
				</div>
				<p className="text-xs text-muted-foreground line-clamp-1 pl-5">
					{formatPopulation(population)}
				</p>
			</div>
		</div>
	);
}