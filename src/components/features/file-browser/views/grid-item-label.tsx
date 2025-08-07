/**
 * @file Componente de label configurable para GridView
 * @description Muestra labels de items con diferentes estilos y posiciones
 */

import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { GridLabelConfig } from '@/types/file-browser/grid-view-config';
import { formatFileSize } from '@/types/file-browser/list-column-config';
import type { AnyEntityWithStats } from '@/types/migration';

interface GridItemLabelProps {
	entity: AnyEntityWithStats;
	config: GridLabelConfig;
	className?: string;
}

/**
 * Componente de label para items del grid
 */
export const GridItemLabel = memo<GridItemLabelProps>(({ entity, config, className = '' }) => {
	// No mostrar si la posición es 'none'
	if (config.position === 'none') {
		return null;
	}

	const name = entity.name || 'Unknown';
	const size = 'stats' in entity && entity.stats && 'size' in entity.stats ? Number(entity.stats.size) || 0 : 0;
	const type = 'type' in entity ? entity.type || 'unknown' : 'unknown';

	// Determinar clases de posicionamiento
	const getPositionClasses = () => {
		switch (config.position) {
			case 'top':
				return 'absolute top-0 left-0 right-0 z-10';
			case 'overlay':
				return 'absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent text-white p-2';
			case 'bottom':
			default:
				return 'mt-2';
		}
	};

	// Determinar clases de texto
	const getTextClasses = () => {
		const baseClasses = 'text-sm';

		if (config.position === 'overlay') {
			return `${baseClasses} text-white`;
		}

		return `${baseClasses} text-foreground`;
	};

	// Truncar texto según configuración
	const getTruncatedName = () => {
		if (config.showFullName) {
			return name;
		}

		// Truncar nombre si es muy largo
		if (name.length > 20) {
			return `${name.substring(0, 17)}...`;
		}

		return name;
	};

	// Renderizar metadata adicional
	const renderMetadata = () => {
		if (!config.showMetadata) {
			return null;
		}

		const metadata = [];

		if (size > 0) {
			metadata.push(formatFileSize(size));
		}

		if (type !== 'unknown') {
			metadata.push(type.toUpperCase());
		}

		if (metadata.length === 0) {
			return null;
		}

		return (
			<div
				className={`text-muted-foreground text-xs mt-1${config.position === 'overlay' ? 'text-white/80' : ''}
			`}
			>
				{metadata.join(' • ')}
			</div>
		);
	};

	// Renderizar contenido del label
	const renderContent = () => {
		const truncatedName = getTruncatedName();

		return (
			<div
				className={`
				${getTextClasses()}
				${config.maxLines > 0 ? `line-clamp-${config.maxLines}` : ''}
			`}
			>
				<div className="truncate font-medium">{truncatedName}</div>
				{renderMetadata()}
			</div>
		);
	};

	// Envolver en tooltip si es necesario
	const content = renderContent();

	if (config.showTooltip && (!config.showFullName || name.length > 20)) {
		return (
			<div className={`${getPositionClasses()} ${className}`}>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="cursor-default">{content}</div>
						</TooltipTrigger>
						<TooltipContent className="max-w-xs" side="bottom">
							<div className="text-sm">
								<div className="font-medium">{name}</div>
								{size > 0 && (
									<div className="mt-1 text-muted-foreground text-xs">
										{formatFileSize(size)} • {type.toUpperCase()}
									</div>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		);
	}

	return <div className={`${getPositionClasses()} ${className}`}>{content}</div>;
});

GridItemLabel.displayName = 'GridItemLabel';

export default GridItemLabel;
