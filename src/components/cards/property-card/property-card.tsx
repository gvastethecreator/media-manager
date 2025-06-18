'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PropertyWithRelations } from '@/types/entities/property';
import { Microscope } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

export interface PropertyCardProps {
	property: PropertyWithRelations & {
		_count?: {
			images?: number;
			videos?: number;
			notes?: number;
			concepts?: number;
			prompts?: number;
			wildcards?: number;
		};
	};
	onClick?: (property: PropertyWithRelations) => void;
	className?: string;
	showBadges?: boolean;
}

/**
 * Card para mostrar una propiedad
 * Sigue el diseño de los otros componentes de tarjetas
 */
export function PropertyCard({ property, onClick, className, showBadges = true }: PropertyCardProps) {
	// Calcular colores
	const primaryColor = useMemo(() => property.color || '#3b82f6', [property.color]);
	const secondaryColor = useMemo(() => {
		if (!property.color) return '#2563eb';

		try {
			// Convertir hex a RGB y oscurecer
			const r = Number.parseInt(property.color.slice(1, 3), 16);
			const g = Number.parseInt(property.color.slice(3, 5), 16);
			const b = Number.parseInt(property.color.slice(5, 7), 16);

			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			return '#2563eb';
		}
	}, [property.color]);

	// Calcular número total de relaciones
	const totalRelations =
		(property._count?.images || 0) +
		(property._count?.videos || 0) +
		(property._count?.notes || 0) +
		(property._count?.concepts || 0) +
		(property._count?.prompts || 0) +
		(property._count?.wildcards || 0);

	const handleClick = () => {
		if (onClick) {
			onClick(property);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (onClick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onClick(property);
		}
	};

	const cardContent = (
		<CardContainer
			className={cn('h-[160px] w-full transition-all', className)}
			primaryColor={primaryColor}
			secondaryColor={secondaryColor}
		>
			{/* Encabezado */}
			<CardHeader
				title={property.name}
				subtitle={property.category || 'General'}
				icon={property.emoji ? <span className="text-lg">{property.emoji}</span> : <Microscope className="h-4 w-4" />}
				primaryColor={primaryColor}
			/>

			{/* Contenido */}
			<div className="flex-1 p-3 flex flex-col">
				{/* Descripción */}
				{property.description && (
					<p className="text-sm line-clamp-2 mb-2 text-muted-foreground">{property.description}</p>
				)}

				{/* Estadísticas */}
				{showBadges && (
					<div className="mt-auto flex flex-wrap gap-1">
						{property._count?.images ? (
							<Badge variant="outline" className="text-xs" style={{ borderColor: `${primaryColor}50` }}>
								{property._count.images} imágenes
							</Badge>
						) : null}

						{property._count?.videos ? (
							<Badge variant="outline" className="text-xs" style={{ borderColor: `${primaryColor}50` }}>
								{property._count.videos} videos
							</Badge>
						) : null}

						{totalRelations > 0 && (
							<Badge variant="outline" className="text-xs" style={{ borderColor: `${primaryColor}50` }}>
								{totalRelations} relaciones
							</Badge>
						)}
					</div>
				)}
			</div>
		</CardContainer>
	);

	// Si hay onClick, usamos un botón para mejor accesibilidad
	if (onClick) {
		return (
			<button
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				className={cn('cursor-pointer text-left p-0 m-0 w-full', className)}
				type="button"
			>
				{cardContent}
			</button>
		);
	}

	// Si no hay onClick, lo envolvemos en Link para navegar a la página de la propiedad
	return (
		<Link href={`/dashboard/properties/${property.id}`} className="block">
			{cardContent}
		</Link>
	);
}

// Exportar también un componente memorizado si es necesario
export const MemoizedPropertyCard = React.memo(PropertyCard);
