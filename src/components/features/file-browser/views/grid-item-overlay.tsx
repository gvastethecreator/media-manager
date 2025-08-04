/**
 * @file Componente de overlay con información para GridView
 * @description Muestra información detallada al hacer hover sobre items del grid
 */

import { Calendar, Clock, FileText, Image, Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo } from 'react';
import type { GridHoverOverlay } from '@/types/file-browser/grid-view-config';
import { formatDate, formatDuration, formatFileSize } from '@/types/file-browser/list-column-config';
import type { AnyEntityWithStats } from '@/types/migration';

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
	const type = entity.type || 'unknown';
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
			case 'bottom':
			default:
				return 'bottom-0 left-0 right-0';
		}
	};

	// Renderizar contenido del overlay
	const renderContent = () => {
		const items = [];

		if (config.showName) {
			items.push(
				<div key="name" className="flex items-center gap-1">
					<FileText className="h-3 w-3 flex-shrink-0" />
					<span className="truncate text-sm font-medium">{name}</span>
				</div>
			);
		}

		if (config.showSize && size > 0) {
			items.push(
				<div key="size" className="flex items-center gap-1">
					<span className="text-xs text-muted-foreground">{formatFileSize(size)}</span>
				</div>
			);
		}

		if (config.showType) {
			items.push(
				<div key="type" className="flex items-center gap-1">
					<span className="text-xs uppercase tracking-wide text-muted-foreground">{type}</span>
				</div>
			);
		}

		if (config.showDimensions && dimensions?.width && dimensions?.height) {
			items.push(
				<div key="dimensions" className="flex items-center gap-1">
					<Image className="h-3 w-3 flex-shrink-0" />
					<span className="text-xs text-muted-foreground">
						{dimensions.width} × {dimensions.height}
					</span>
				</div>
			);
		}

		if (config.showDuration && typeof duration === 'number') {
			items.push(
				<div key="duration" className="flex items-center gap-1">
					<Clock className="h-3 w-3 flex-shrink-0" />
					<span className="text-xs text-muted-foreground">{formatDuration(duration)}</span>
				</div>
			);
		}

		if (config.showDate && mtime) {
			items.push(
				<div key="date" className="flex items-center gap-1">
					<Calendar className="h-3 w-3 flex-shrink-0" />
					<span className="text-xs text-muted-foreground">{formatDate(new Date(mtime))}</span>
				</div>
			);
		}

		if (config.showTags && tags.length > 0) {
			items.push(
				<div key="tags" className="flex items-center gap-1">
					<Tag className="h-3 w-3 flex-shrink-0" />
					<div className="flex flex-wrap gap-1">
						{tags.slice(0, 2).map((tag: string, index: number) => (
							<span
								key={index}
								className="inline-block px-1 py-0.5 rounded text-xs bg-secondary/80 text-secondary-foreground"
							>
								{tag}
							</span>
						))}
						{tags.length > 2 && <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>}
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
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.15 }}
					className={`
						absolute z-10 pointer-events-none
						${getPositionClasses()}
						${className}
					`}
				>
					<div
						className={`
							max-w-full m-1 p-2 rounded-md shadow-lg
							${config.showBackground ? 'bg-background/95 border border-border backdrop-blur-sm' : ''}
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
