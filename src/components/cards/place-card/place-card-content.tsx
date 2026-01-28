import { AlertTriangleIcon, CircleDollarSignIcon, ShieldIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlaceCardContentProps {
	description?: string;
	region?: string;
	type?: string;
	climate?: string;
	population: number;
	government?: string;
	parsedResources?: Array<{ name: string; abundance: number; description?: string }>;
	parsedDangers?: Array<{ type: string; level: number; description?: string }>;
	parsedStats?: Record<string, number>;
	primaryColor?: string;
	tcgMode?: boolean;
	compact?: boolean;
}

/**
 * Componente para mostrar el contenido principal de una tarjeta de lugar
 * Muestra la descripción, recursos, peligros y estadísticas del lugar
 */
export function PlaceCardContent({
	description,
	region,
	type,
	climate,
	population,
	government,
	parsedResources = [],
	parsedDangers = [],
	parsedStats = {},
	primaryColor = 'var(--dt-success-500)',
	tcgMode = true,
	compact = false,
}: PlaceCardContentProps) {
	// Descripción corta para mostrar
	const shortDescription =
		description && description.length > 120 ? `${description.substring(0, 120)}...` : description;

	// Calcular la longitud de elementos a mostrar basada en el modo compacto
	const maxTags = compact ? 2 : 4;

	// Determinar qué estadísticas mostrar
	const displayStats = Object.entries(parsedStats || {})
		.filter(([key]) => ['defense', 'influence', 'wealth', 'danger'].includes(key))
		.slice(0, compact ? 2 : 4);

	// Función para obtener ícono según tipo de estadística
	const getStatIcon = (statName: string) => {
		switch (statName.toLowerCase()) {
			case 'defense':
				return <ShieldIcon className="mr-1 h-3 w-3" />;
			case 'wealth':
				return <CircleDollarSignIcon className="mr-1 h-3 w-3" />;
			case 'danger':
				return <AlertTriangleIcon className="mr-1 h-3 w-3" />;
			default:
				return null;
		}
	};

	// Calcular colores para elementos de UI basados en el color primario
	const tagColor = `color-mix(in oklab, ${primaryColor}, transparent 30%)`;
	const borderColor = `color-mix(in oklab, ${primaryColor}, transparent 70%)`;

	return (
		<div
			className={cn('flex flex-col px-3 py-2', compact ? 'space-y-1' : 'space-y-2')}
			style={{
				background: tcgMode ? `linear-gradient(to bottom, transparent, color-mix(in oklab, ${primaryColor}, transparent 90%))` : undefined,
				borderBottom: tcgMode ? `1px solid ${borderColor}` : undefined,
			}}
		>
			{/* Descripción del lugar */}
			{shortDescription && (
				<div className={cn('text-xs leading-tight', compact ? 'line-clamp-2' : 'line-clamp-3')}>{shortDescription}</div>
			)}

			{/* Información básica del lugar si no está en modo TCG */}
			{!tcgMode && (
				<div className="flex flex-wrap gap-1 text-xs">
					{region && (
						<Badge className="h-5 px-1" variant="outline">
							<span className="text-xs">{region}</span>
						</Badge>
					)}
					{type && (
						<Badge className="h-5 px-1" variant="outline">
							<span className="text-xs">{type}</span>
						</Badge>
					)}
					{climate && (
						<Badge className="h-5 px-1" variant="outline">
							<span className="text-xs">{climate}</span>
						</Badge>
					)}
				</div>
			)}

			{/* Sección TCG de recursos y peligros */}
			{tcgMode && !compact && (
				<div className="grid grid-cols-2 gap-2 text-xs">
					{/* Columna de recursos */}
					{parsedResources && parsedResources.length > 0 && (
						<div className="space-y-1">
							<div className="flex items-center font-semibold text-xs" style={{ color: primaryColor }}>
								<CircleDollarSignIcon className="mr-1 h-3 w-3" />
								Recursos
							</div>
							<div className="flex flex-wrap gap-1">
								{parsedResources.slice(0, maxTags).map((resource) => (
									<Badge
										className="h-5 bg-muted/10 px-1 text-xs"
										key={`resource-${resource.name}`}
										style={{ borderColor: tagColor }}
										variant="outline"
									>
										{resource.name}
									</Badge>
								))}
								{parsedResources.length > maxTags && (
									<Badge className="h-5 bg-muted/10 px-1 text-xs" style={{ borderColor: tagColor }} variant="outline">
										+{parsedResources.length - maxTags}
									</Badge>
								)}
							</div>
						</div>
					)}

					{/* Columna de peligros */}
					{parsedDangers && parsedDangers.length > 0 && (
						<div className="space-y-1">
							<div className="flex items-center font-semibold text-xs" style={{ color: primaryColor }}>
								<AlertTriangleIcon className="mr-1 h-3 w-3" />
								Peligros
							</div>
							<div className="flex flex-wrap gap-1">
								{parsedDangers.slice(0, maxTags).map((danger) => (
									<Badge
										className="h-5 bg-muted/10 px-1 text-xs"
										key={`danger-${danger.type}`}
										style={{ borderColor: tagColor }}
										variant="outline"
									>
										{danger.type}
									</Badge>
								))}
								{parsedDangers.length > maxTags && (
									<Badge className="h-5 bg-muted/10 px-1 text-xs" style={{ borderColor: tagColor }} variant="outline">
										+{parsedDangers.length - maxTags}
									</Badge>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Estadísticas del lugar en modo TCG */}
			{tcgMode && displayStats.length > 0 && (
				<div className={cn('grid gap-1', compact ? 'grid-cols-2' : 'grid-cols-4')}>
					{displayStats.map(([stat, value]) => (
						<div
							className="flex items-center rounded bg-black/5 px-1 py-0.5 text-xs"
							key={`stat-${stat}`}
							style={{ borderLeft: `2px solid ${primaryColor}` }}
						>
							{getStatIcon(stat)}
							<span className="capitalize">{stat}</span>
							<span className="ml-auto font-medium">{value}</span>
						</div>
					))}
				</div>
			)}

			{/* Gobierno y población en modo compacto y tcg */}
			{tcgMode && compact && (government || population !== undefined) && (
				<div className="flex gap-2 text-xs">
					{government && (
						<div className="flex flex-1 items-center">
							<span className="mr-1 font-semibold">Gob:</span>
							<span className="truncate">{government}</span>
						</div>
					)}
					{population !== undefined && (
						<div className="flex items-center">
							<span className="mr-1 font-semibold">Pop:</span>
							<span>{population.toLocaleString()}</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
