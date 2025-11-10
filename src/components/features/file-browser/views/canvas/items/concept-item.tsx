/**
 * @file Canvas item especializado para conceptos
 * @module components/features/file-browser/views/canvas/items/concept-item
 * @description Componente de canvas para renderizar conceptos en el FileBrowser
 */

import { Heart, Lightbulb } from 'lucide-react';
import { BaseItem, type BaseItemProps } from './base-item';
import { cn } from '@/lib/utils';

export interface ConceptItemProps extends BaseItemProps {
	/** Compact mode - menos información */
	compact?: boolean;
}

/**
 * Obtiene el gradiente de fondo basado en el color del concepto
 */
function getConceptGradient(color?: string | null): string {
	if (!color) return 'from-purple-400/20 to-purple-600/20';
	return `from-[${color}]/20 to-[${color}]/40`;
}

/**
 * Item canvas especializado para conceptos
 */
export function ConceptItem({ item, size, compact = false, ...baseProps }: ConceptItemProps) {
	const concept = item as any;
	const emoji = concept.emoji || '💡';
	const color = concept.color || '#a855f7';
	const isFavorite = concept.isFavorite;
	const imageCount = concept._count?.images || concept.totalImages || 0;
	const videoCount = concept._count?.videos || concept.totalVideos || 0;

	// Campos específicos de conceptos
	const definition = concept.definition;
	const category = concept.category;

	const gradient = getConceptGradient(color);

	return (
		<BaseItem item={item} size={size} {...baseProps}>
			<div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
				{/* Fondo con gradiente */}
				<div
					className={cn('absolute inset-0 bg-gradient-to-br', gradient)}
					style={
						color ? { background: `linear-gradient(to bottom right, ${color}15, ${color}30)` } : undefined
					}
				/>

				{/* Contenido */}
				<div className="relative h-full flex flex-col p-3">
					{/* Header con emoji y favorito */}
					<div className="flex items-start justify-between mb-2">
						<div className="text-4xl leading-none" style={{ fontSize: compact ? '2rem' : '2.5rem' }}>
							{emoji}
						</div>

						{isFavorite && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
					</div>

					{/* Nombre y detalles */}
					<div className="flex-1 flex flex-col justify-center min-h-0">
						<p
							className={cn(
								'font-semibold text-gray-900 dark:text-gray-100 line-clamp-2',
								compact ? 'text-sm' : 'text-base'
							)}
						>
							{item.name}
						</p>

						{/* Categoría */}
						{!compact && category && (
							<p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">{category}</p>
						)}

						{/* Definición */}
						{!compact && definition && (
							<p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mt-0.5">{definition}</p>
						)}
					</div>

					{/* Footer con stats */}
					{(imageCount > 0 || videoCount > 0) && (
						<div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
							{imageCount > 0 && (
								<div className="flex items-center gap-1">
									<span>🖼️</span>
									<span>{imageCount}</span>
								</div>
							)}
							{videoCount > 0 && (
								<div className="flex items-center gap-1">
									<span>🎬</span>
									<span>{videoCount}</span>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Badge del tipo */}
				<div className="absolute top-2 right-2">
					<div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-black/10 dark:bg-white/10 backdrop-blur-sm">
						<Lightbulb className="w-3 h-3" />
						<span>Concept</span>
					</div>
				</div>
			</div>
		</BaseItem>
	);
}
