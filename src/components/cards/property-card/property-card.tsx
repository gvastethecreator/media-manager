import { AlertCircle, Microscope } from 'lucide-react';
import React, { memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PropertyWithStats } from '@/types/entities/property';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

export interface PropertyCardProps {
	className?: string;
	onClick?: () => void;
	property: PropertyWithStats;
	showBadges?: boolean;
}

/**
 * Card para mostrar una propiedad - Refactorizado para usar PropertyWithStats
 * Sigue el diseño de los otros componentes de tarjetas estandarizados
 */
export const PropertyCard = memo(function PropertyCard({
	property,
	onClick,
	className,
	showBadges = true,
}: PropertyCardProps) {
	// Calcular colores
	const primaryColor = useMemo(() => property?.color || 'var(--dt-primary-500)', [property?.color]);
	const secondaryColor = useMemo(() => {
		return `color-mix(in oklab, ${primaryColor}, black 20%)`;
	}, [primaryColor]);

	// Calcular número total de relaciones desde stats
	const totalRelations = property?.stats?.totalRelations ?? 0;

	const handleClick = useCallback(() => {
		if (onClick) {
			onClick();
		}
	}, [onClick]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick]
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
							<Badge
								className="text-sm"
								style={{ borderColor: `color-mix(in oklab, ${primaryColor}, transparent 50%)` }}
								variant="outline"
							>
								{totalRelations} relaciones
							</Badge>
						)}
					</div>
				)}
			</div>
		</CardContainer>
	);

	// Validación simple de property requerida
	if (!property) {
		return (
			<CardContainer className={cn('border-red-300 bg-red-50', className)}>
				<CardHeader
					icon={<AlertCircle className="h-4 w-4 text-destructive" />}
					primaryColor="var(--dt-danger-500)"
					title="Property no encontrada"
				/>
				<p className="text-destructive">Error: Property not found</p>
			</CardContainer>
		);
	} // Si hay onClick, usamos un botón para mejor accesibilidad
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
});

// Exportar también un componente memorizado si es necesario
export const MemoizedPropertyCard = PropertyCard;
