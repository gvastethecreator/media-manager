/**
 * @file Canvas item especializado para prompts
 * @module components/features/file-browser/views/canvas/items/prompt-item
 * @description Componente de canvas para renderizar prompts en el FileBrowser
 */

import { Heart, FileText } from 'lucide-react';
import { BaseItem, type BaseItemProps } from './base-item';
import { cn } from '@/lib/utils';

export interface PromptItemProps extends BaseItemProps {
	/** Compact mode - menos información */
	compact?: boolean;
}

/**
 * Obtiene el gradiente de fondo basado en el color del prompt
 */
function getPromptGradient(color?: string | null): string {
	if (!color) return 'from-cyan-400/20 to-cyan-600/20';
	return `from-[${color}]/20 to-[${color}]/40`;
}

/**
 * Item canvas especializado para prompts
 */
export function PromptItem({ item, size, compact = false, ...baseProps }: PromptItemProps) {
	const prompt = item as any;
	const emoji = prompt.emoji || '📝';
	const color = prompt.color || '#06b6d4';
	const isFavorite = prompt.isFavorite;
	const imageCount = prompt._count?.images || prompt.totalImages || 0;
	const videoCount = prompt._count?.videos || prompt.totalVideos || 0;

	// Campos específicos de prompts
	const model = prompt.model;
	const category = prompt.category;
	const parameters = prompt.parameters;

	const gradient = getPromptGradient(color);

	// Construir línea de información
	const infoLine = [model, category].filter(Boolean).join(' • ');

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

						{/* Modelo y categoría */}
						{!compact && infoLine && (
							<p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">{infoLine}</p>
						)}

						{/* Parámetros */}
						{!compact && parameters && (
							<p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1 mt-0.5">
								{typeof parameters === 'string' ? parameters : JSON.stringify(parameters)}
							</p>
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
						<FileText className="w-3 h-3" />
						<span>Prompt</span>
					</div>
				</div>
			</div>
		</BaseItem>
	);
}
