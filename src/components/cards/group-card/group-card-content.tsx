import { FilterIcon, FunctionSquareIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GroupCardContentProps {
	category?: string;
	compact?: boolean;
	description?: string;
	entityCounts?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		tags?: number;
	};
	filtersCount?: number;
	flexibilityScore?: number;
	organizationType?: string;
	primaryColor?: string;
	tcgMode?: boolean;
}

/**
 * Componente para mostrar el contenido principal de una tarjeta de grupo
 */
export function GroupCardContent({
	description,
	category = 'General',
	organizationType = 'Mixto',
	flexibilityScore = 1,
	filtersCount = 0,
	entityCounts = {},
	primaryColor = 'var(--dt-primary-500)',
	tcgMode = true,
	compact = false,
}: GroupCardContentProps) {
	// Descripción corta para mostrar
	const shortDescription =
		description && description.length > 120 ? `${description.substring(0, 120)}...` : description;

	// Calcular grupos de entidades para estadísticas
	const mediaCount = (entityCounts.images || 0) + (entityCounts.videos || 0);
	const collectionCount = (entityCounts.albums || 0) + (entityCounts.collections || 0);
	const worldCount =
		(entityCounts.characters || 0) +
		(entityCounts.places || 0) +
		(entityCounts.worldItems || 0) +
		(entityCounts.concepts || 0);
	const utilityCount =
		(entityCounts.prompts || 0) +
		(entityCounts.notes || 0) +
		(entityCounts.wildcards || 0) +
		(entityCounts.properties || 0);
	const totalEntities = Object.values(entityCounts).reduce((sum, count) => sum + (count || 0), 0);

	// Calcular colores para elementos de UI basados en el color primario
	const _tagColor = `${primaryColor}70`;
	const borderColor = `${primaryColor}30`;

	return (
		<div
			className={cn('flex flex-col px-3 py-2', compact ? 'space-y-1' : 'space-y-1.5')}
			style={{
				background: tcgMode ? `linear-gradient(to bottom, transparent, ${primaryColor}10)` : undefined,
				borderBottom: tcgMode ? `1px solid ${borderColor}` : undefined,
			}}
		>
			{/* Descripción del grupo */}
			{shortDescription && (
				<div className={cn('text-sm leading-tight', compact ? 'line-clamp-2' : 'line-clamp-3')}>{shortDescription}</div>
			)}

			{/* Filtros y flexibilidad en modo TCG */}
			{tcgMode && !compact && (
				<div className="flex justify-between text-sm">
					{/* Filtros */}
					{filtersCount > 0 && (
						<div className="flex items-center space-x-1">
							<FilterIcon className="h-4 w-4" style={{ color: primaryColor }} />
							<span className="font-medium">
								{filtersCount} {filtersCount === 1 ? 'filter' : 'filters'}
							</span>
						</div>
					)}

					{/* Flexibilidad */}
					{flexibilityScore > 0 && (
						<div className="flex items-center space-x-1">
							<FunctionSquareIcon className="h-4 w-4" style={{ color: primaryColor }} />
							<span className="font-medium">Flex: {flexibilityScore}</span>
						</div>
					)}
				</div>
			)}

			{/* Estadísticas de entidades en modo TCG */}
			{tcgMode && totalEntities > 0 && (
				<div className={cn('grid gap-1', compact ? 'grid-cols-2' : 'grid-cols-4')}>
					{mediaCount > 0 && (
						<div
							className="flex items-center justify-between rounded bg-black/5 px-1.5 py-0.5 text-sm"
							style={{ borderLeft: `2px solid ${primaryColor}` }}
						>
							<span>Media</span>
							<span className="font-medium">{mediaCount}</span>
						</div>
					)}

					{collectionCount > 0 && (
						<div
							className="flex items-center justify-between rounded bg-black/5 px-1.5 py-0.5 text-sm"
							style={{ borderLeft: `2px solid ${primaryColor}` }}
						>
							<span>Colec.</span>
							<span className="font-medium">{collectionCount}</span>
						</div>
					)}

					{worldCount > 0 && (
						<div
							className="flex items-center justify-between rounded bg-black/5 px-1.5 py-0.5 text-sm"
							style={{ borderLeft: `2px solid ${primaryColor}` }}
						>
							<span>Mundo</span>
							<span className="font-medium">{worldCount}</span>
						</div>
					)}

					{utilityCount > 0 && (
						<div
							className="flex items-center justify-between rounded bg-black/5 px-1.5 py-0.5 text-sm"
							style={{ borderLeft: `2px solid ${primaryColor}` }}
						>
							<span>Util.</span>
							<span className="font-medium">{utilityCount}</span>
						</div>
					)}

					{/* Si hay más categorías que las que caben, mostrar total */}
					{compact && totalEntities > 0 && (
						<div
							className="flex items-center justify-between rounded bg-black/5 px-1.5 py-0.5 text-sm"
							style={{ borderLeft: `2px solid ${primaryColor}` }}
						>
							<span>Total</span>
							<span className="font-medium">{totalEntities}</span>
						</div>
					)}
				</div>
			)}

			{/* Información no-TCG */}
			{!tcgMode && (
				<div className="mt-auto flex flex-wrap gap-1 text-sm">
					<Badge className="h-5 px-1" variant="outline">
						<span className="text-sm">{category}</span>
					</Badge>

					{organizationType && (
						<Badge className="h-5 px-1" variant="outline">
							<span className="text-sm">{organizationType}</span>
						</Badge>
					)}

					{filtersCount > 0 && (
						<Badge className="h-5 px-1" variant="outline">
							<span className="text-sm">{filtersCount} filters</span>
						</Badge>
					)}

					{totalEntities > 0 && (
						<Badge className="h-5 px-1" variant="outline">
							<span className="text-sm">{totalEntities} elementos</span>
						</Badge>
					)}
				</div>
			)}
		</div>
	);
}
