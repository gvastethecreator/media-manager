import { Shuffle } from 'lucide-react';
import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WildcardWithStats as Wildcard } from '@/types/entities/wildcard';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

export interface WildcardCardProps {
	wildcard: Wildcard;
	onClick?: (wildcard: Wildcard) => void;
	className?: string;
	showBadges?: boolean;
}

/**
 * Card para mostrar un comodín
 * Sigue el diseño de los otros componentes de tarjetas
 */
export const WildcardCard = memo(function WildcardCard({
	wildcard,
	onClick,
	className,
	showBadges = true,
}: WildcardCardProps) {
	// Calcular colores
	const primaryColor = useMemo(() => wildcard.color || 'var(--dt-primary-500)', [wildcard.color]);
	const secondaryColor = useMemo(() => {
		if (!wildcard.color) return 'var(--dt-primary-600)';
		// Usar color-mix para oscurecer
		return `color-mix(in oklab, ${wildcard.color}, black 30%)`;
	}, [wildcard.color]);

	// Calcular número total de relaciones
	const totalMedia = (wildcard._count?.images || 0) + (wildcard._count?.videos || 0);

	const childCount = wildcard._count?.childWildcards || 0;

	const handleClick = () => {
		if (onClick) {
			onClick(wildcard);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (onClick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onClick(wildcard);
		}
	};

	// Intentar parsear los hijos de comodines si están almacenados como JSON string
	const children = useMemo(() => {
		if (typeof wildcard.children === 'string' && wildcard.children !== 'empty_array') {
			try {
				return JSON.parse(wildcard.children);
			} catch (_e) {
				return [];
			}
		}
		return [];
	}, [wildcard.children]);

	const cardContent = (
		<CardContainer
			className={cn('h-[160px] w-full transition-all', className)}
			primaryColor={primaryColor}
			secondaryColor={secondaryColor}
		>
			{/* Encabezado */}
			<CardHeader
				icon={wildcard.emoji ? <span className="text-lg">{wildcard.emoji}</span> : <Shuffle className="h-4 w-4" />}
				primaryColor={primaryColor}
				subtitle={wildcard.category || 'General'}
				title={wildcard.name}
			/>

			{/* Contenido */}
			<div className="flex flex-1 flex-col p-3">
				{/* Descripción */}
				{wildcard.description && (
					<p className="mb-2 line-clamp-2 text-muted-foreground text-sm">{wildcard.description}</p>
				)}

				{/* Estadísticas */}
				{showBadges && (
					<div className="mt-auto flex flex-wrap gap-1">
						{totalMedia > 0 && (
							<Badge
								className="px-2 py-1 text-sm"
								style={{ borderColor: `color-mix(in oklab, ${primaryColor}, transparent 50%)` }}
								variant="outline"
							>
								{totalMedia} archivos
							</Badge>
						)}

						{childCount > 0 && (
							<Badge
								className="px-2 py-1 text-sm"
								style={{ borderColor: `color-mix(in oklab, ${primaryColor}, transparent 50%)` }}
								variant="outline"
							>
								{childCount} variantes
							</Badge>
						)}

						{Array.isArray(children) && children.length > 0 && (
							<Badge
								className="px-2 py-1 text-sm"
								style={{ borderColor: `color-mix(in oklab, ${primaryColor}, transparent 50%)` }}
								variant="outline"
							>
								{children.length} opciones
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
				className={cn('m-0 w-full cursor-pointer p-0 text-left', className)}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				type="button"
			>
				{cardContent}
			</button>
		);
	}

	// Si no hay onClick, lo envolvemos en un Link para navegar a la página del comodín
	return (
		<Link className="block" to={`/dashboard/wildcards/${wildcard.id}`}>
			{cardContent}
		</Link>
	);
});

// Exportar también un componente memorizado
export const MemoizedWildcardCard = WildcardCard;
