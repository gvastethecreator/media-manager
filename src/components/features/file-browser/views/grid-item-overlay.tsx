/**
 * @file Componente de overlay con información para GridView
 * @description Muestra información detallada al hacer hover sobre items del grid
 */

import { Calendar, Clock, FileText, Image, Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, type ReactElement } from 'react';
import type { GridHoverOverlay } from '@/types/file-browser/grid-view-config';
import { formatDate, formatDuration, formatFileSize } from '@/types/file-browser/list-column-config';
import type { AnyEntityWithStats } from '@/types/migration';
import { getEntityStatsType } from '@/types/migration';

interface GridItemOverlayProps {
	entity: AnyEntityWithStats;
	config: GridHoverOverlay;
	isVisible: boolean;
	className?: string;
}

/**
 * Overlay de información para items del grid
 */
export const GridItemOverlay = memo<GridItemOverlayProps>(({ entity, config, isVisible, className = '' }) => {
	// Obtener información del entity
	const name = entity.name || 'Unknown';
	const size = entity.stats?.size || 0;
	const mtime = entity.stats?.mtime;
	const type = getEntityStatsType(entity) ?? 'unknown';
	const dimensions = (entity as any).dimensions;
	const duration = (entity as any).duration;
	const tags = (entity as any).tags || [];

	// Determinar posición del overlay
	const getPositionClasses = () => {
		switch (config.position) {
			case 'top':
				return 'top-0 left-0 right-0';
			case 'center':
				return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
			default:
				return 'bottom-0 left-0 right-0';
		}
	};

	// Renderizar contenido del overlay
	const renderContent = () => {
		const items: ReactElement[] = [];

		if (config.showName) {
			items.push(
				<div className="flex items-center gap-1" key="name">
					<FileText className="h-3 w-3 flex-shrink-0" />
					<span className="truncate font-medium text-sm">{name}</span>
				</div>
			);
		}

		if (config.showSize && size > 0) {
			items.push(
				<div className="flex items-center gap-1" key="size">
					<span className="text-muted-foreground text-xs">{formatFileSize(size)}</span>
				</div>
			);
		}

		if (config.showType) {
			items.push(
				<div className="flex items-center gap-1" key="type">
					<span className="text-muted-foreground text-xs uppercase tracking-wide">{type}</span>
				</div>
			);
		}

		if (config.showDimensions && dimensions?.width && dimensions?.height) {
			items.push(
				<div className="flex items-center gap-1" key="dimensions">
					<Image className="h-3 w-3 flex-shrink-0" />
					<span className="text-muted-foreground text-xs">
						{dimensions.width} × {dimensions.height}
					</span>
				</div>
			);
		}

		if (config.showDuration && typeof duration === 'number') {
			items.push(
				<div className="flex items-center gap-1" key="duration">
					<Clock className="h-3 w-3 flex-shrink-0" />
					<span className="text-muted-foreground text-xs">{formatDuration(duration)}</span>
				</div>
			);
		}

		if (config.showDate && mtime) {
			items.push(
				<div className="flex items-center gap-1" key="date">
					<Calendar className="h-3 w-3 flex-shrink-0" />
					<span className="text-muted-foreground text-xs">{formatDate(new Date(mtime))}</span>
				</div>
			);
		}

		if (config.showTags && tags.length > 0) {
			items.push(
				<div className="flex items-center gap-1" key="tags">
					<Tag className="h-3 w-3 flex-shrink-0" />
					<div className="flex flex-wrap gap-1">
						{tags.slice(0, 2).map((tag: string) => (
							<span
								className="inline-block rounded bg-secondary/80 px-1 py-0.5 text-secondary-foreground text-xs"
								key={tag}
							>
								{tag}
							</span>
						))}
						{tags.length > 2 && <span className="text-muted-foreground text-xs">+{tags.length - 2}</span>}
					</div>
				</div>
			);
		}

		return items;
	};

	const content = renderContent();

	// No mostrar overlay si no hay contenido
	if (content.length === 0) {
		return null;
	}

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					animate={{ opacity: 1, scale: 1 }}
					className={`pointer-events-none absolute z-10 ${getPositionClasses()}
						${className}
					`}
					exit={{ opacity: 0, scale: 0.95 }}
					initial={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.15 }}
				>
					<div
						className={`m-1 max-w-full rounded-md p-2 shadow-lg${config.showBackground ? 'border border-border bg-background/95 backdrop-blur-sm' : ''}
						`}
					>
						<div className="space-y-1">{content}</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
});

GridItemOverlay.displayName = 'GridItemOverlay';

export default GridItemOverlay;
