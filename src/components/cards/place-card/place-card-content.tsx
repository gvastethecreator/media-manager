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
	primaryColor = '#10b981',
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
				return <ShieldIcon className="w-3 h-3 mr-1" />;
			case 'wealth':
				return <CircleDollarSignIcon className="w-3 h-3 mr-1" />;
			case 'danger':
				return <AlertTriangleIcon className="w-3 h-3 mr-1" />;
			default:
				return null;
		}
	};

	// Calcular colores para elementos de UI basados en el color primario
	const tagColor = `${primaryColor}70`;
	const borderColor = `${primaryColor}30`;

	return (
		<div
			className={cn('flex flex-col px-3 py-2', compact ? 'space-y-1' : 'space-y-2')}
			style={{
				background: tcgMode ? `linear-gradient(to bottom, transparent, ${primaryColor}10)` : undefined,
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
						<Badge variant="outline" className="px-1 h-5">
							<span className="text-xs">{region}</span>
						</Badge>
					)}
					{type && (
						<Badge variant="outline" className="px-1 h-5">
							<span className="text-xs">{type}</span>
						</Badge>
					)}
					{climate && (
						<Badge variant="outline" className="px-1 h-5">
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
							<div className="font-semibold text-xs flex items-center" style={{ color: primaryColor }}>
								<CircleDollarSignIcon className="w-3 h-3 mr-1" />
								Recursos
							</div>
							<div className="flex flex-wrap gap-1">
								{parsedResources.slice(0, maxTags).map((resource) => (
									<Badge
										key={`resource-${resource.name}`}
										variant="outline"
										className="px-1 h-5 bg-black/10 text-xs"
										style={{ borderColor: tagColor }}
									>
										{resource.name}
									</Badge>
								))}
								{parsedResources.length > maxTags && (
									<Badge variant="outline" className="px-1 h-5 bg-black/10 text-xs" style={{ borderColor: tagColor }}>
										+{parsedResources.length - maxTags}
									</Badge>
								)}
							</div>
						</div>
					)}

					{/* Columna de peligros */}
					{parsedDangers && parsedDangers.length > 0 && (
						<div className="space-y-1">
							<div className="font-semibold text-xs flex items-center" style={{ color: primaryColor }}>
								<AlertTriangleIcon className="w-3 h-3 mr-1" />
								Peligros
							</div>
							<div className="flex flex-wrap gap-1">
								{parsedDangers.slice(0, maxTags).map((danger) => (
									<Badge
										key={`danger-${danger.type}`}
										variant="outline"
										className="px-1 h-5 bg-black/10 text-xs"
										style={{ borderColor: tagColor }}
									>
										{danger.type}
									</Badge>
								))}
								{parsedDangers.length > maxTags && (
									<Badge variant="outline" className="px-1 h-5 bg-black/10 text-xs" style={{ borderColor: tagColor }}>
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
							key={`stat-${stat}`}
							className="flex items-center text-xs bg-black/5 rounded px-1 py-0.5"
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
						<div className="flex-1 flex items-center">
							<span className="font-semibold mr-1">Gob:</span>
							<span className="truncate">{government}</span>
						</div>
					)}
					{population !== undefined && (
						<div className="flex items-center">
							<span className="font-semibold mr-1">Pop:</span>
							<span>{population.toLocaleString()}</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
