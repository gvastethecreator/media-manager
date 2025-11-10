/**
 * @file Canvas item genérico para entidades abstractas
 * @module components/features/file-browser/views/canvas/items/entity-item
 * @description Componente base para renderizar entidades abstractas en el FileBrowser
 */

import { Heart } from 'lucide-react';
import { BaseItem, type BaseItemProps } from './base-item';
import { cn } from '@/lib/utils';

export interface EntityItemProps extends BaseItemProps {
	/** Mostrar contador de imágenes */
	showImageCount?: boolean;
	/** Mostrar contador de videos */
	showVideoCount?: boolean;
	/** Mostrar indicador de favorito */
	showFavorite?: boolean;
	/** Compact mode - menos información */
	compact?: boolean;
}

/**
 * Obtiene el gradiente de fondo basado en el color de la entidad
 */
function getEntityGradient(color?: string | null): string {
	if (!color) return 'from-gray-400/20 to-gray-600/20';

	// Convertir color hex a HSL para crear gradiente
	const rgb = hexToRgb(color);
	if (!rgb) return `from-[${color}]/20 to-[${color}]/40`;

	const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
	const darkerL = Math.max(0, l - 15);

	return `from-[hsl(${h},${s}%,${l}%)]/20 to-[hsl(${h},${s}%,${darkerL}%)]/40`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Item canvas genérico para cualquier entidad abstracta
 */
export function EntityItem({
	item,
	size,
	showImageCount = true,
	showVideoCount = true,
	showFavorite = true,
	compact = false,
	...baseProps
}: EntityItemProps) {
	const emoji = (item as any).emoji || '📦';
	const color = (item as any).color;
	const isFavorite = (item as any).isFavorite;
	const imageCount = (item as any)._count?.images || (item as any).totalImages || 0;
	const videoCount = (item as any)._count?.videos || (item as any).totalVideos || 0;
	const description = (item as any).description;

	const gradient = getEntityGradient(color);

	return (
		<BaseItem item={item} size={size} {...baseProps}>
			<div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
				{/* Fondo con gradiente basado en el color de la entidad */}
				<div
					className={cn(
						'absolute inset-0 bg-gradient-to-br',
						gradient
					)}
					style={color ? { background: `linear-gradient(to bottom right, ${color}15, ${color}30)` } : undefined}
				/>

				{/* Contenido */}
				<div className="relative h-full flex flex-col p-3">
					{/* Header con emoji y favorito */}
					<div className="flex items-start justify-between mb-2">
						<div
							className="text-4xl leading-none"
							style={{ fontSize: compact ? '2rem' : '2.5rem' }}
						>
							{emoji}
						</div>

						{showFavorite && isFavorite && (
							<Heart className="w-4 h-4 text-red-500 fill-red-500" />
						)}
					</div>

					{/* Nombre */}
					<div className="flex-1 flex flex-col justify-center">
						<p className={cn(
							'font-semibold text-gray-900 dark:text-gray-100 line-clamp-2',
							compact ? 'text-sm' : 'text-base'
						)}>
							{item.name}
						</p>

						{!compact && description && (
							<p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
								{description}
							</p>
						)}
					</div>

					{/* Footer con stats */}
					{(showImageCount || showVideoCount) && (imageCount > 0 || videoCount > 0) && (
						<div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
							{showImageCount && imageCount > 0 && (
								<div className="flex items-center gap-1">
									<span>🖼️</span>
									<span>{imageCount}</span>
								</div>
							)}
							{showVideoCount && videoCount > 0 && (
								<div className="flex items-center gap-1">
									<span>🎬</span>
									<span>{videoCount}</span>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Badge del tipo de entidad */}
				<div className="absolute top-2 right-2">
					<div className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/10 dark:bg-white/10 backdrop-blur-sm">
						{item.entityType}
					</div>
				</div>
			</div>
		</BaseItem>
	);
}
