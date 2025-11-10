/**
 * @file Canvas item especializado para world items
 * @module components/features/file-browser/views/canvas/items/world-item-item
 * @description Componente de canvas para renderizar world items en el FileBrowser
 */

import { Heart, Package } from 'lucide-react';
import { BaseItem, type BaseItemProps } from './base-item';
import { cn } from '@/lib/utils';

export interface WorldItemItemProps extends BaseItemProps {
	/** Compact mode - menos información */
	compact?: boolean;
}

/**
 * Obtiene el gradiente de fondo basado en el color del item
 */
function getWorldItemGradient(color?: string | null): string {
	if (!color) return 'from-amber-400/20 to-amber-600/20';
	return `from-[${color}]/20 to-[${color}]/40`;
}

/**
 * Obtiene el color del badge de rareza
 */
function getRarityColor(rarity?: string): string {
	if (!rarity) return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';

	const rarityLower = rarity.toLowerCase();
	if (rarityLower.includes('common')) return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
	if (rarityLower.includes('uncommon')) return 'bg-green-500/20 text-green-700 dark:text-green-300';
	if (rarityLower.includes('rare')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
	if (rarityLower.includes('epic')) return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
	if (rarityLower.includes('legendary')) return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';

	return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
}

/**
 * Item canvas especializado para world items
 */
export function WorldItemItem({ item, size, compact = false, ...baseProps }: WorldItemItemProps) {
	const worldItem = item as any;
	const emoji = worldItem.emoji || '📦';
	const color = worldItem.color || '#f59e0b';
	const isFavorite = worldItem.isFavorite;
	const imageCount = worldItem._count?.images || worldItem.totalImages || 0;
	const videoCount = worldItem._count?.videos || worldItem.totalVideos || 0;

	// Campos específicos de world items
	const type = worldItem.type;
	const rarity = worldItem.rarity;
	const effects = worldItem.effects;

	const gradient = getWorldItemGradient(color);
	const rarityColorClass = getRarityColor(rarity);

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

						{/* Badges de tipo y rareza */}
						{!compact && (type || rarity) && (
							<div className="flex items-center gap-2 mt-1 flex-wrap">
								{type && (
									<span className="px-1.5 py-0.5 rounded text-xs bg-gray-500/20 text-gray-700 dark:text-gray-300">
										{type}
									</span>
								)}
								{rarity && <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', rarityColorClass)}>{rarity}</span>}
							</div>
						)}

						{/* Efectos */}
						{!compact && effects && (
							<p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1 mt-1">{effects}</p>
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
						<Package className="w-3 h-3" />
						<span>Item</span>
					</div>
				</div>
			</div>
		</BaseItem>
	);
}
