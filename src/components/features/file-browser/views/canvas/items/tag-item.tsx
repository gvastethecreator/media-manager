/**
 * @file Canvas item especializado para tags
 * @module components/features/file-browser/views/canvas/items/tag-item
 * @description Componente de canvas para renderizar tags en el FileBrowser
 */

import { Heart, Tag } from 'lucide-react';
import { BaseItem, type BaseItemProps } from './base-item';
import { cn } from '@/lib/utils';

export interface TagItemProps extends BaseItemProps {
	/** Compact mode - menos información */
	compact?: boolean;
}

/**
 * Obtiene el gradiente de fondo basado en el color del tag
 */
function getTagGradient(color?: string | null): string {
	if (!color) return 'from-pink-400/20 to-pink-600/20';
	return `from-[${color}]/20 to-[${color}]/40`;
}

/**
 * Item canvas especializado para tags (versión simplificada)
 */
export function TagItem({ item, size, compact = false, ...baseProps }: TagItemProps) {
	const tag = item as any;
	const emoji = tag.emoji || '🏷️';
	const color = tag.color || '#ec4899';
	const isFavorite = tag.isFavorite;
	const imageCount = tag._count?.images || tag.totalImages || 0;
	const videoCount = tag._count?.videos || tag.totalVideos || 0;

	const gradient = getTagGradient(color);

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

					{/* Nombre */}
					<div className="flex-1 flex flex-col justify-center min-h-0">
						<p
							className={cn(
								'font-semibold text-gray-900 dark:text-gray-100 line-clamp-2',
								compact ? 'text-sm' : 'text-base'
							)}
						>
							{item.name}
						</p>
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
						<Tag className="w-3 h-3" />
						<span>Tag</span>
					</div>
				</div>
			</div>
		</BaseItem>
	);
}
