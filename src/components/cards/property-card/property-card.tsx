// TODO: Refactorizar para usar el tipo canónico `PropertyWithStats`.
// Este componente actualmente define su propio tipo extendido para la prop `property`,
// lo que causa inconsistencias. Debería recibir una prop `property` del tipo `PropertyWithStats`
// que ya incluya `totalAssociations` calculado. Esta refactorización está bloqueada
// por los mismos fallos en la herramienta de edición que impiden corregir las
// server actions de la entidad `Property`.

import { Microscope } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useProperty } from '@/lib/api/properties';
import { cn } from '@/lib/utils';
import type { PropertyWithStats } from '@/types/entities/property';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

export interface PropertyCardProps {
	propertyId: string;
	onClick?: (propertyData: PropertyWithStats) => void;
	className?: string;
	showBadges?: boolean;
}

/**
 * Card para mostrar una propiedad
 * Sigue el diseño de los otros componentes de tarjetas
 */
export function PropertyCard({ propertyId, onClick, className, showBadges = true }: PropertyCardProps) {
	const { data: property, isLoading, error } = useProperty(propertyId);
	// Hooks arriba; estados tempranos abajo

	// Calcular colores
	const primaryColor = useMemo(() => property?.color || '#3b82f6', [property?.color]);
	const secondaryColor = useMemo(() => {
		if (!property?.color) {
			return '#2563eb';
		}

		try {
			// Convertir hex a RGB y oscurecer
			const r = Number.parseInt(primaryColor.slice(1, 3), 16);
			const g = Number.parseInt(primaryColor.slice(3, 5), 16);
			const b = Number.parseInt(primaryColor.slice(5, 7), 16);

			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			return '#2563eb';
		}
	}, [primaryColor, property?.color]);

	// Calcular número total de relaciones desde stats o totalAssociations
	const totalRelations = property?.stats?.totalRelations ?? 0;

	const handleClick = useCallback(() => {
		if (onClick && property) {
			onClick(property);
		}
	}, [onClick, property]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ') && property) {
				e.preventDefault();
				onClick(property);
			}
		},
		[onClick, property]
	);

	const cardContent = (
		<CardContainer
			className={cn('h-[160px] w-full transition-all', className)}
			primaryColor={primaryColor}
			secondaryColor={secondaryColor}
		>
			{/* Encabezado */}
			<CardHeader
				icon={property?.emoji ? <span className="text-lg">{property.emoji}</span> : <Microscope className="h-4 w-4" />}
				primaryColor={primaryColor}
				subtitle={property?.category || 'General'}
				title={property?.name || ''}
			/>

			{/* Contenido */}
			<div className="flex flex-1 flex-col p-3">
				{/* Descripción */}
				{property?.description && (
					<p className="mb-2 line-clamp-2 text-muted-foreground text-sm">{property.description}</p>
				)}

				{/* Estadísticas */}
				{showBadges && (
					<div className="mt-auto flex flex-wrap gap-1">
						{totalRelations > 0 && (
							<Badge className="text-xs" style={{ borderColor: `${primaryColor}50` }} variant="outline">
								{totalRelations} relaciones
							</Badge>
						)}
					</div>
				)}
			</div>
		</CardContainer>
	);

	// Estados tempranos
	if (isLoading) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
					className
				)}
			>
				<p className="text-gray-500">Cargando propiedad...</p>
			</div>
		);
	}

	if (error || !property) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Propiedad no encontrada'}</p>
			</div>
		);
	}

	// Si hay onClick, usamos un botón para mejor accesibilidad
	if (onClick) {
		return (
			<button
				className={cn('m-0 w-full cursor-pointer p-0 text-left', className)}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				type="button"
			>
				{cardContent}
			</button>
		);
	}

	// Si no hay onClick, lo envolvemos en Link para navegar a la página de la propiedad
	return (
		<Link className="block" to={`/dashboard/properties/${property.id}`}>
			{cardContent}
		</Link>
	);
}

// Exportar también un componente memorizado si es necesario
export const MemoizedPropertyCard = React.memo(PropertyCard);
